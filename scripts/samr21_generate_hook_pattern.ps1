param(
    [string]$OutFile = "firmware\samr21-factory-hook\generated_frame.inc",
    [ValidateSet("bars", "checker", "rect")]
    [string]$Pattern = "bars",
    [int]$Width = 600,
    [int]$Height = 448,
    [switch]$Invert
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outPath = Join-Path $repoRoot $OutFile
$pixels = New-Object int[] 33600

for ($i = 0; $i -lt $pixels.Length; $i++) {
    if ($Pattern -eq "rect") {
        $pixels[$i] = if ($Invert) { 0x00 } else { 0xFF }
    }
    elseif ($Pattern -eq "checker") {
        $block = [Math]::Floor($i / 64)
        $pixels[$i] = if (($block % 2) -eq 0) { 0xAA } else { 0x55 }
    }
    else {
        $region = [Math]::Floor(($i * 4) / $pixels.Length)
        $pixels[$i] = @(0x00, 0xFF, 0xAA, 0x55)[$region]
    }
}

if ($Pattern -eq "rect") {
    $usedBytes = [int](($Width * $Height) / 8)
    if (($Width % 8) -ne 0 -or $usedBytes -gt 33600) {
        throw "Width must be divisible by 8, and Width x Height / 8 must be <= 33600 bytes."
    }
    $bytesPerRow = [int]($Width / 8)
    $left = [int]($Width * 0.2)
    $top = [int]($Height * 0.25)
    $right = [int]($Width * 0.8)
    $bottom = [int]($Height * 0.65)
    $leftByte = [int]($left / 8)
    $rightByte = [int]($right / 8)
    $fillByte = if ($Invert) { 0xFF } else { 0x00 }
    for ($y = $top; $y -lt $bottom; $y++) {
        for ($xb = $leftByte; $xb -lt $rightByte; $xb++) {
            $idx = ($y * $bytesPerRow) + $xb
            $pixels[$idx] = $fillByte
        }
    }
}

$bytes = New-Object byte[] 33600
for ($i = 0; $i -lt $bytes.Length; $i++) {
    $bytes[$i] = [byte]($pixels[$i] -band 0xFF)
}

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("static const uint8_t frame_data[33600] = {")
for ($i = 0; $i -lt $bytes.Length; $i += 16) {
    $line = "    "
    $end = [Math]::Min($i + 15, $bytes.Length - 1)
    for ($j = $i; $j -le $end; $j++) {
        $line += ("0x{0:x2}" -f $bytes[$j])
        if ($j -lt ($bytes.Length - 1)) {
            $line += ", "
        }
    }
    [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine("};")

New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
Set-Content -Path $outPath -Value $sb.ToString() -Encoding ASCII
Write-Host "Generated $outPath"

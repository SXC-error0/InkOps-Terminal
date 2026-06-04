param(
    [string]$OutFile = "firmware\samr21-factory-hook\generated_frame.inc",
    [string]$Text = "HELLO`nWORLD",
    [int]$Width = 600,
    [int]$Height = 448,
    [int]$RowStrideBytes = 0,
    [int]$Scale = 10,
    [switch]$Invert,
    [switch]$ColumnMajor,
    [switch]$LsbFirst
)

$ErrorActionPreference = "Stop"

$font = @{
    " " = @("00000","00000","00000","00000","00000","00000","00000")
    "A" = @("01110","10001","10001","11111","10001","10001","10001")
    "B" = @("11110","10001","10001","11110","10001","10001","11110")
    "C" = @("01111","10000","10000","10000","10000","10000","01111")
    "D" = @("11110","10001","10001","10001","10001","10001","11110")
    "E" = @("11111","10000","10000","11110","10000","10000","11111")
    "F" = @("11111","10000","10000","11110","10000","10000","10000")
    "G" = @("01111","10000","10000","10111","10001","10001","01111")
    "H" = @("10001","10001","10001","11111","10001","10001","10001")
    "I" = @("11111","00100","00100","00100","00100","00100","11111")
    "J" = @("00111","00010","00010","00010","10010","10010","01100")
    "K" = @("10001","10010","10100","11000","10100","10010","10001")
    "L" = @("10000","10000","10000","10000","10000","10000","11111")
    "M" = @("10001","11011","10101","10101","10001","10001","10001")
    "N" = @("10001","11001","10101","10011","10001","10001","10001")
    "O" = @("01110","10001","10001","10001","10001","10001","01110")
    "P" = @("11110","10001","10001","11110","10000","10000","10000")
    "Q" = @("01110","10001","10001","10001","10101","10010","01101")
    "R" = @("11110","10001","10001","11110","10100","10010","10001")
    "S" = @("01111","10000","10000","01110","00001","00001","11110")
    "T" = @("11111","00100","00100","00100","00100","00100","00100")
    "U" = @("10001","10001","10001","10001","10001","10001","01110")
    "V" = @("10001","10001","10001","10001","10001","01010","00100")
    "W" = @("10001","10001","10001","10101","10101","10101","01010")
    "X" = @("10001","10001","01010","00100","01010","10001","10001")
    "Y" = @("10001","10001","01010","00100","00100","00100","00100")
    "Z" = @("11111","00001","00010","00100","01000","10000","11111")
    "0" = @("01110","10001","10011","10101","11001","10001","01110")
    "1" = @("00100","01100","00100","00100","00100","00100","01110")
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outPath = Join-Path $repoRoot $OutFile
$bytesPerRow = [int]($Width / 8)
$storageBytesPerRow = if ($RowStrideBytes -gt 0) { $RowStrideBytes } else { $bytesPerRow }
$bytesPerColumn = [int]($Height / 8)
$usedBytes = $storageBytesPerRow * $Height
if ($usedBytes -gt 33600) {
    throw "Width x Height / 8 must be <= 33600 bytes."
}
$bytes = New-Object byte[] 33600
for ($i = 0; $i -lt $bytes.Length; $i++) {
    $bytes[$i] = if ($Invert) { 0x00 } else { 0xff }
}

function Set-BlackPixel([int]$x, [int]$y) {
    if ($x -lt 0 -or $x -ge $Width -or $y -lt 0 -or $y -ge $Height) {
        return
    }
    if ($ColumnMajor) {
        $idx = ($x * $bytesPerColumn) + [int]($y / 8)
        $bitIndex = $y % 8
    }
    else {
        $idx = ($y * $storageBytesPerRow) + [int]($x / 8)
        $bitIndex = $x % 8
    }
    $bit = if ($LsbFirst) { $bitIndex } else { 7 - $bitIndex }
    if ($Invert) {
        $bytes[$idx] = [byte]($bytes[$idx] -bor (1 -shl $bit))
    }
    else {
        $bytes[$idx] = [byte]($bytes[$idx] -band (-bnot (1 -shl $bit)))
    }
}

$lines = ($Text.ToUpper() -split "`n")
$charW = 5 * $Scale
$charH = 7 * $Scale
$gap = 1 * $Scale
$lineGap = 2 * $Scale
$totalH = ($lines.Count * $charH) + (($lines.Count - 1) * $lineGap)
$y0 = [int](($Height - $totalH) / 2)

for ($li = 0; $li -lt $lines.Count; $li++) {
    $line = $lines[$li]
    $lineW = ($line.Length * $charW) + ([Math]::Max(0, $line.Length - 1) * $gap)
    $x0 = [int](($Width - $lineW) / 2)
    $yLine = $y0 + ($li * ($charH + $lineGap))

    for ($ci = 0; $ci -lt $line.Length; $ci++) {
        $ch = [string]$line[$ci]
        if (-not $font.ContainsKey($ch)) {
            $ch = " "
        }
        $glyph = $font[$ch]
        $xChar = $x0 + ($ci * ($charW + $gap))
        for ($gy = 0; $gy -lt 7; $gy++) {
            for ($gx = 0; $gx -lt 5; $gx++) {
                if ($glyph[$gy][$gx] -eq "1") {
                    for ($sy = 0; $sy -lt $Scale; $sy++) {
                        for ($sx = 0; $sx -lt $Scale; $sx++) {
                            Set-BlackPixel ($xChar + ($gx * $Scale) + $sx) ($yLine + ($gy * $Scale) + $sy)
                        }
                    }
                }
            }
        }
    }
}

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("static const uint8_t frame_data[33600] = {")
for ($i = 0; $i -lt $bytes.Length; $i += 16) {
    $end = [Math]::Min($i + 15, $bytes.Length - 1)
    $items = @()
    for ($j = $i; $j -le $end; $j++) {
        $items += ("0x{0:x2}" -f $bytes[$j])
    }
    $line = "    " + ($items -join ", ")
    if ($end -lt ($bytes.Length - 1)) {
        $line += ","
    }
    [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine("};")

New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
$ascii = [System.Text.Encoding]::ASCII
[System.IO.File]::WriteAllText($outPath, $sb.ToString().TrimEnd("`r", "`n") + "`n", $ascii)
Write-Host "Generated $outPath ($Width x $Height)"

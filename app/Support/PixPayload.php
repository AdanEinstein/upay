<?php

namespace App\Support;

use App\Enums\PixKeyType;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Str;

/**
 * Static PIX "copia e cola" (EMV BR Code) for a key and an optional amount.
 */
class PixPayload
{
    public static function make(PixKeyType $type, string $key, string $merchantName, ?int $amountCents = null): string
    {
        $account = self::field('00', 'br.gov.bcb.pix').self::field('01', self::normalizeKey($type, $key));

        $payload = self::field('00', '01')
            .self::field('26', $account)
            .self::field('52', '0000')
            .self::field('53', '986')
            .($amountCents ? self::field('54', number_format($amountCents / 100, 2, '.', '')) : '')
            .self::field('58', 'BR')
            .self::field('59', self::ascii($merchantName, 25))
            // ponytail: no city stored per shop; "BRASIL" is accepted by banks, add a city column if one rejects it
            .self::field('60', 'BRASIL')
            .self::field('62', self::field('05', '***'))
            .'6304';

        return $payload.self::crc16($payload);
    }

    public static function qrSvg(string $payload): string
    {
        $renderer = new ImageRenderer(new RendererStyle(320, 1), new SvgImageBackEnd);

        return (new Writer($renderer))->writeString($payload);
    }

    private static function normalizeKey(PixKeyType $type, string $key): string
    {
        return match ($type) {
            PixKeyType::Cpf, PixKeyType::Cnpj => preg_replace('/\D/', '', $key),
            PixKeyType::Phone => '+55'.preg_replace('/^55(?=\d{10,11}$)/', '', preg_replace('/\D/', '', $key)),
            default => trim($key),
        };
    }

    private static function ascii(string $value, int $max): string
    {
        return Str::upper(Str::limit(Str::ascii($value), $max, ''));
    }

    private static function field(string $id, string $value): string
    {
        return $id.str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT).$value;
    }

    private static function crc16(string $data): string
    {
        $crc = 0xFFFF;

        foreach (str_split($data) as $char) {
            $crc ^= ord($char) << 8;

            for ($bit = 0; $bit < 8; $bit++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) & 0xFFFF : ($crc << 1) & 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}

<?php

namespace App\Support;

use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Enums\StockMovementReason;
use App\Models\Installment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates a sale with its items, stock movements, installments and any
 * immediate payment in a single transaction.
 */
class RegisterSale
{
    /**
     * @param  array{customer_id: int|null, items: list<array{product_id: int, variant_id: int|null, quantity: int}>, payment_type: string, payment_method: string, installments?: int|null, down_payment_cents?: int|null, first_due_date?: string|null}  $data
     */
    public function handle(array $data): Sale
    {
        return DB::transaction(function () use ($data): Sale {
            $lines = [];
            $total = 0;

            foreach ($data['items'] as $index => $item) {
                $product = Product::query()->findOrFail($item['product_id']);
                $variant = $item['variant_id'] ? ProductVariant::query()->where('product_id', $product->id)->findOrFail($item['variant_id']) : null;
                $available = $variant?->stock_qty ?? $product->stock_qty;

                if ($item['quantity'] > $available) {
                    throw ValidationException::withMessages(["items.{$index}.quantity" => __('Not enough stock.')]);
                }

                $unitPrice = $variant?->price_cents ?? $product->price_cents;
                $total += $unitPrice * $item['quantity'];
                $lines[] = compact('product', 'variant', 'unitPrice') + ['quantity' => $item['quantity']];
            }

            $sale = Sale::create([
                'customer_id' => $data['customer_id'],
                'total_cents' => $total,
                'status' => SaleStatus::Completed,
                'sold_at' => now(),
            ]);

            foreach ($lines as $line) {
                $sale->items()->create([
                    'product_id' => $line['product']->id,
                    'product_variant_id' => $line['variant']?->id,
                    'quantity' => $line['quantity'],
                    'unit_price_cents' => $line['unitPrice'],
                ]);

                $line['product']->decrement('stock_qty', $line['quantity']);
                $line['variant']?->decrement('stock_qty', $line['quantity']);

                $line['product']->stockMovements()->create([
                    'product_variant_id' => $line['variant']?->id,
                    'sale_id' => $sale->id,
                    'quantity_delta' => -$line['quantity'],
                    'reason' => StockMovementReason::Sale,
                ]);
            }

            $this->createInstallments($sale, $data);

            return $sale;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createInstallments(Sale $sale, array $data): void
    {
        $method = PaymentMethod::from($data['payment_method']);
        $total = $sale->total_cents;

        if ($data['payment_type'] === 'avista') {
            $this->installment($sale, 1, $total, today())->payments()->create([
                'amount_cents' => $total,
                'method' => $method,
                'paid_at' => now(),
            ]);

            return;
        }

        if ($data['payment_type'] === 'fiado') {
            // ponytail: fiado has no due-date field in the design; default to 30 days.
            $this->installment($sale, 1, $total, today()->addDays(30));

            return;
        }

        $entry = min((int) ($data['down_payment_cents'] ?? 0), $total);
        $count = (int) $data['installments'];
        $rest = $total - $entry;

        if ($entry > 0) {
            $this->installment($sale, 0, $entry, today())->payments()->create([
                'amount_cents' => $entry,
                'method' => $method,
                'paid_at' => now(),
            ]);
        }

        $firstDue = CarbonImmutable::parse($data['first_due_date'] ?? today()->addMonth()->toDateString());
        $base = (int) round($rest / $count);

        for ($number = 1; $number <= $count; $number++) {
            $amount = $number === $count ? $rest - $base * ($count - 1) : $base;
            $this->installment($sale, $number, $amount, $firstDue->addMonthsNoOverflow($number - 1));
        }
    }

    private function installment(Sale $sale, int $number, int $amount, CarbonInterface $dueDate): Installment
    {
        return $sale->installments()->create([
            'customer_id' => $sale->customer_id,
            'number' => $number,
            'amount_cents' => $amount,
            'due_date' => $dueDate->toDateString(),
        ]);
    }
}

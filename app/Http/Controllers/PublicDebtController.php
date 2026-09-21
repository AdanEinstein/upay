<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Sale;
use App\Models\ShopSetting;
use App\Support\PixPayload;
use App\Support\Tenant;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PublicDebtController extends Controller
{
    public function show(string $token): Response|HttpResponse
    {
        $customer = Customer::query()->withoutTenant()->where('public_token', $token)->with('organization')->first();

        if ($customer === null || ! $customer->organization->isActive()) {
            return Inertia::render('public/invalid')->toResponse(request())->setStatusCode(404);
        }

        Tenant::use($customer->organization);
        app()->terminating(Tenant::forget(...));

        $settings = ShopSetting::current();
        $pix = $settings->pix_key && $settings->pix_key_type;

        $sales = Sale::query()
            ->where('customer_id', $customer->id)
            ->where('status', SaleStatus::Completed)
            ->with(['items.product', 'items.variant', 'installments' => fn ($query) => $query->orderBy('number'), 'installments.payments'])
            ->latest('sold_at')
            ->get();

        $purchases = $sales->map(fn (Sale $sale) => [
            'id' => $sale->id,
            'soldAt' => $sale->sold_at->toDateString(),
            'totalCents' => $sale->total_cents,
            'paidCents' => (int) $sale->installments->flatMap->payments->sum('amount_cents'),
            'installmentCount' => $sale->installments->count(),
            'status' => $sale->settlement()['status'],
            'items' => $sale->items->map(fn ($item) => [
                'name' => trim($item->product->name.' '.($item->variant?->name ?? '')),
                'quantity' => $item->quantity,
                'totalCents' => $item->quantity * $item->unit_price_cents,
            ])->values(),
            'installments' => $sale->installments->map(fn (Installment $installment) => $this->installment($installment, $settings, $pix, $customer->organization->name))->values(),
        ])->values();

        return Inertia::render('public/debt', [
            'store' => $customer->organization->name,
            'customer' => $customer->name,
            'whatsapp' => $settings->whatsapp,
            'purchases' => $purchases,
            'openCents' => $this->openCents($sales),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function installment(Installment $installment, ShopSetting $settings, bool $pix, string $store): array
    {
        $paidCents = (int) $installment->payments->sum('amount_cents');
        $remaining = max(0, $installment->amount_cents - $paidCents);
        $payload = $pix && $remaining > 0 ? PixPayload::make($settings->pix_key_type, $settings->pix_key, $store, $remaining) : null;

        return [
            'id' => $installment->id,
            'number' => $installment->number,
            'dueDate' => $installment->due_date->toDateString(),
            'amountCents' => $installment->amount_cents,
            'remainingCents' => $remaining,
            'paidAt' => $remaining === 0 ? $installment->payments->max('paid_at')?->toDateString() : null,
            'status' => match (true) {
                $remaining === 0 => 'paid',
                $installment->due_date->isToday() => 'due_today',
                $installment->due_date->isPast() => 'overdue',
                default => 'upcoming',
            },
            'pixCode' => $payload,
            'pixQr' => $payload ? PixPayload::qrSvg($payload) : null,
        ];
    }

    /**
     * @param  Collection<int, Sale>  $sales
     */
    private function openCents(Collection $sales): int
    {
        return (int) $sales->flatMap->installments->sum(fn (Installment $installment) => max(0, $installment->amount_cents - $installment->payments->sum('amount_cents')));
    }
}

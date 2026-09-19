<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Models\ErrorOccurrence;
use App\Models\Organization;
use App\Support\ErrorOccurrenceRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class ErrorOccurrenceController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->integer('status') ?: null;
        $organizationId = $request->integer('organization_id') ?: null;

        $occurrences = ErrorOccurrence::query()
            ->with(['organization:id,name', 'user:id,name'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
            ->latest('created_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ErrorOccurrence $occurrence) => [
                'id' => $occurrence->id,
                'status' => $occurrence->status,
                'method' => $occurrence->method,
                'path' => $occurrence->path,
                'exceptionClass' => $occurrence->exception_class,
                'message' => $occurrence->message,
                'trace' => $occurrence->trace,
                'organizationName' => $occurrence->organization?->name,
                'userName' => $occurrence->user?->name,
                'createdAt' => $occurrence->created_at,
            ]);

        return Inertia::render('super/errors', [
            'occurrences' => $occurrences,
            'organizations' => Organization::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => ErrorOccurrenceRecorder::RECORDED_STATUSES,
            'filters' => [
                'status' => $status,
                'organizationId' => $organizationId,
            ],
            'kpis' => [
                'last24h' => ErrorOccurrence::query()->where('created_at', '>=', Date::now()->subDay())->count(),
                'last7d' => ErrorOccurrence::query()->where('created_at', '>=', Date::now()->subDays(7))->count(),
            ],
        ]);
    }
}

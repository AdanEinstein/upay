<?php

namespace App\Models\Concerns;

use App\Support\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Scopes the model to the currently active tenant (App\Support\Tenant).
 *
 * Outside of a tenant context (console, jobs, seeders) the scope is a no-op —
 * queries run unscoped, so code running there must call Tenant::use()
 * explicitly or filter by organization_id itself.
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (Tenant::check()) {
                $builder->where($builder->getModel()->getTable().'.organization_id', Tenant::id());
            }
        });

        static::creating(function (Model $model) {
            if (Tenant::check() && ! $model->getAttribute('organization_id')) {
                $model->setAttribute('organization_id', Tenant::id());
            }
        });
    }

    /**
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeWithoutTenant(Builder $builder): Builder
    {
        return $builder->withoutGlobalScope('tenant');
    }
}

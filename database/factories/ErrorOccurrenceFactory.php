<?php

namespace Database\Factories;

use App\Models\ErrorOccurrence;
use Illuminate\Database\Eloquent\Factories\Factory;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @extends Factory<ErrorOccurrence>
 */
class ErrorOccurrenceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'status' => 404,
            'method' => 'GET',
            'path' => fake()->slug(2),
            'exception_class' => NotFoundHttpException::class,
            'message' => fake()->sentence(),
            'trace' => '#0 {main}',
        ];
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SearchMacrosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('search_macro_test_items', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->string('description')->nullable();
        });

        DB::table('search_macro_test_items')->insert([
            ['name' => 'Servidor Dell', 'code' => 'srv-001', 'description' => 'Torre'],
            ['name' => 'Notebook Lenovo', 'code' => 'nbk-002', 'description' => null],
            ['name' => 'Monitor LG', 'code' => 'mon-003', 'description' => 'Servico incluso'],
        ]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('search_macro_test_items');

        parent::tearDown();
    }

    public function test_where_like_matches_case_insensitively(): void
    {
        $results = DB::table('search_macro_test_items')
            ->whereLike('name', '%dell%')
            ->get();

        $this->assertCount(1, $results);
        $this->assertSame('Servidor Dell', $results->first()->name);
    }

    public function test_or_where_like_composes_with_other_conditions(): void
    {
        $results = DB::table('search_macro_test_items')
            ->where('id', '>', 0)
            ->orWhereLike('code', '%002%')
            ->get();

        $this->assertGreaterThanOrEqual(1, $results->count());
        $this->assertTrue($results->pluck('code')->contains('nbk-002'));
    }

    public function test_search_text_falls_back_to_like_across_multiple_columns(): void
    {
        $results = DB::table('search_macro_test_items')
            ->searchText(['name', 'description'], 'servico')
            ->get();

        $this->assertCount(1, $results);
        $this->assertSame('Monitor LG', $results->first()->name);
    }

    public function test_search_text_composes_with_other_where_clauses(): void
    {
        $results = DB::table('search_macro_test_items')
            ->where('code', 'srv-001')
            ->searchText(['name', 'description'], 'notebook')
            ->get();

        $this->assertCount(0, $results);
    }
}

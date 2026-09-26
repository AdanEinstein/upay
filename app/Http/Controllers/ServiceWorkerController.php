<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Vite;

/**
 * Serves resources/js/service-worker.js with the current build's asset list,
 * so every deploy installs a fresh worker that precaches the new files. While
 * `vite dev` runs it passes the dev server origin instead, whose modules the
 * worker caches as they load, so offline can be tried out locally too.
 * Extensionless on purpose: nginx serves *.js straight from public/.
 */
class ServiceWorkerController extends Controller
{
    public function __invoke(): Response
    {
        $assets = $this->buildAssets();
        $script = (string) file_get_contents(resource_path('js/service-worker.js'));
        $version = substr(md5(json_encode($assets).$script), 0, 12);

        $devServer = Vite::isRunningHot() ? rtrim((string) file_get_contents(Vite::hotFile())) : null;

        return response(
            'const VERSION = '.json_encode($version).";\nconst ASSETS = ".json_encode($assets, JSON_UNESCAPED_SLASHES)
                .";\nconst DEV_SERVER = ".json_encode($devServer, JSON_UNESCAPED_SLASHES).";\n\n".$script,
            headers: [
                'Content-Type' => 'text/javascript; charset=utf-8',
                'Cache-Control' => 'no-cache',
            ],
        );
    }

    /**
     * Every file of the Vite build; empty while the dev server is running.
     *
     * @return list<string>
     */
    private function buildAssets(): array
    {
        $manifest = public_path('build/manifest.json');

        if (Vite::isRunningHot() || ! is_file($manifest)) {
            return [];
        }

        /** @var array<string, array{file: string, css?: list<string>, assets?: list<string>}> $chunks */
        $chunks = json_decode((string) file_get_contents($manifest), true);

        return collect($chunks)
            ->flatMap(fn (array $chunk): array => [$chunk['file'], ...($chunk['css'] ?? []), ...($chunk['assets'] ?? [])])
            ->unique()
            ->map(fn (string $file): string => "/build/{$file}")
            ->values()
            ->all();
    }
}

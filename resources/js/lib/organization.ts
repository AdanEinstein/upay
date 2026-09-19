export function currentOrganization(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    return decodeURIComponent(window.location.pathname.split('/')[1] ?? '');
}

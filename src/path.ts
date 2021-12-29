const SLASH = '/';

export const ensureStartSlash = (path: string) => {
    return path[0] !== SLASH ? `/${path}` : path;
}
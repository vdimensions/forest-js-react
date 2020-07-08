import React from 'react';
import { pipe } from '@vdimensions/forest-js-frontend';

export const ComponentRegistryContext = new Map<string, React.FC<any>>();

const registerComponent : { <T> (key: string|string[], component : React.FC<T>) : React.FC<T>  } = (key, component) => {
    const keys: string[] = !Array.isArray(key) ? [key] : key;
    for (let i = 0; i < keys.length; i++) {
        ComponentRegistryContext.set(keys[i], component);
    }
    return component;
}

const id = (x: any) => x;

export function ForestMappingView<P, Q> (name: string, modelMapper: (arg: P) => Q, view: React.FC<Q>): React.FC<P> {
    return registerComponent(name, pipe(modelMapper, view));
}
export function ForestView<T> (name: string, view: React.FC<T>): React.FC<T> {
    return ForestMappingView<T, T>(name, id, view)
}
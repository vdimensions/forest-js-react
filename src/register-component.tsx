import React from "react";

export const ComponentRegistryContext = new Map<string, React.FC<any>>();

export const RegisterComponent : { <T> (key: string|string[], component : React.FC<T>) : React.FC<T>  } = (key, component) => {
    const keys: string[] = !Array.isArray(key) ? [key] : key;
    for (let i = 0; i < keys.length; i++) {
        ComponentRegistryContext.set(keys[i], component);
    }
    return component;
}


import React, { useContext, Dispatch, useCallback } from "react";
import { ViewState, ForestResponse, RegionMap } from "@vdimensions/forest-js-frontend";
import { useForestClient } from "./client-context";
import { useHistory } from "react-router-dom";
import { useViewContext } from "./view";

const SLASH = '/';
export const ensureStartSlash = (path: string) => {
    return path[0] !== SLASH ? `/${path}` : path;
}

export type ForestHooks = {
    useNavigate: { () : { (template: string) : void } },
    useCommand: { (command: string) : { (arg?: any) : void } }
}
export type ForestStore = {
    useDispatch: () => Dispatch<ForestResponse>,
    useRootHierarchy: () => RegionMap,
    useViewState: (instanceId: string) => ViewState|undefined,
}

export const EMPTY_ROOT_HIERARCHY: RegionMap = { "": [] };
export const EMPTY_FOREST_RESPONSE = ForestResponse.empty();

export const ForestHooksDefault: ForestHooks & ForestStore = {
    // HOOKS
    useDispatch: () => (_) => { },
    useNavigate: () => (_: string) => { },
    useCommand: (_: string) => (_?: any) => { },
    // STORE
    useRootHierarchy: () => EMPTY_ROOT_HIERARCHY,
    useViewState: (_: string) => undefined,
};

export const ForestStoreContext = React.createContext<ForestStore>(ForestHooksDefault);
export const useForestSelectors = () => useContext(ForestStoreContext);

export const useNavigate = () =>  {
    const {useDispatch} = useForestSelectors();
    const dispach = useDispatch();
    const client = useForestClient();
    const {replace} = useHistory();
    return useCallback((template: string) => {
        client
            .navigate(template)
            .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
            .then(x => {
                replace(ensureStartSlash(x.path), x)
                return x;
            })
            .then(dispach);
    }, [client, dispach, replace]);
};

export const useCommand = ((command: string) =>  {
    const {useDispatch} = useForestSelectors();
    const dispach = useDispatch();
    const {push} = useHistory();
    const client = useForestClient();
    const instanceId = useViewContext();
    return useCallback((arg?: any) => {
        client
            .invokeCommand(instanceId, command, arg)
            .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
            .then(x => {
                push(ensureStartSlash(x.path), x);
                return x;
            })
            .then(dispach);
    }, [command, instanceId, client, dispach, push]);
});
import { ForestResponse, RegionMap, ViewState } from "@vdimensions/forest-js-frontend";
import React, { Dispatch, useContext } from "react";

export const EMPTY_ROOT_HIERARCHY: RegionMap = { "": [] };
export const EMPTY_FOREST_RESPONSE = ForestResponse.empty();

export type ForestStore = {
    useDispatch: () => Dispatch<ForestResponse>,
    useRootHierarchy: () => RegionMap,
    useViewState: (instanceId: string) => ViewState|undefined,
}

export const NoopStore : ForestStore = {
    useDispatch: () => (_) => { },
    useRootHierarchy: () => EMPTY_ROOT_HIERARCHY,
    useViewState: (_: string) => undefined
}

export const ForestStoreContext = React.createContext<ForestStore>(NoopStore);
export const useForestSelectors = () => useContext(ForestStoreContext);
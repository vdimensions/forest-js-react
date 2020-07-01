import{useMemo, useReducer, Reducer} from "react";
import {
    appStateSelector,
    ForestResponse,
    rootHierarchySelector,
    viewStateSelector,
    mapUndefined, 
    pipe
} from "@vdimensions/forest-js-frontend";
import {ForestHooksDefault, EMPTY_FOREST_RESPONSE} from "./hooks";

const reducerMethod = <T> (_: T, data: T) => data;

export const useForestReducerStore = () => {
    const [state, dispatch] = useReducer<Reducer<ForestResponse, ForestResponse>>(reducerMethod, EMPTY_FOREST_RESPONSE);
    
    const selectors = useMemo(() => {
        return {
            useRootHierarchy: () => {
                const data = (mapUndefined(pipe(appStateSelector, rootHierarchySelector)))(state);
                return data || ForestHooksDefault.useRootHierarchy();
            },
            useViewState: (instanceId: string) => {
                const map1 = pipe(appStateSelector, viewStateSelector(instanceId));
                const data = (mapUndefined(map1))(state);
                return data || ForestHooksDefault.useViewState(instanceId);
            }
        }
    }, [state]);
    return {
        useDispatch: () => dispatch,
        ...selectors
    }
}
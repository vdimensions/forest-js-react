import{useMemo, useReducer, Reducer} from "react";
import {
    appStateSelector,
    ForestResponse,
    rootHierarchySelector,
    viewStateSelector,
    mapUndefined,
    pipe,
    ViewState
} from "@vdimensions/forest-js-frontend";
import { EMPTY_FOREST_RESPONSE, NoopStore } from "./store";

type ViewStateMap = { [id: string] : ViewState }
type ViewStateKeyMap = { [id: string] : boolean }

const reducerMethod = (state: ForestResponse, data: ForestResponse) => {
    if (data.path === state.path) {
        const mergedViewStates: ViewStateMap = { };
        const viewStateKeys: ViewStateKeyMap = { };
        state.views.forEach((vs: ViewState) => {
            mergedViewStates[vs.id] = vs;
            viewStateKeys[vs.id] = false;
        });
        data.views.forEach((vs: ViewState) => {
            const existing = mergedViewStates[vs.id];
            if (existing) {
                mergedViewStates[vs.id] = new ViewState({
                    ...existing,
                    model: {...existing.model, ...vs.model},
                    regions: {...existing.regions, ...vs.regions},
                    commands: {...existing.commands, ...vs.commands }
                });
            } else {
                mergedViewStates[vs.id] = new ViewState(vs);
            }
            viewStateKeys[vs.id] = true;
        });
        const views : Array<ViewState> = [];
        // delete viewstates for views no longer returned by the server
        Object.keys(viewStateKeys).forEach(k => {
            if (viewStateKeys[k]) {
                views.push(mergedViewStates[k]);
            }
        });
        return {
            ...state,
            views
        }

    } else {
        return data;
    }
};

export const useForestReducerStore = () => {
    const [state, dispatch] = useReducer<Reducer<ForestResponse, ForestResponse>>(reducerMethod, EMPTY_FOREST_RESPONSE);

    const selectors = useMemo(() => {
        return {
            useRootHierarchy: () => {
                const data = (mapUndefined(pipe(appStateSelector, rootHierarchySelector)))(state);
                return data || NoopStore.useRootHierarchy();
            },
            useViewState: (instanceId: string) => {
                const map1 = pipe(appStateSelector, viewStateSelector(instanceId));
                const data = (mapUndefined(map1))(state);
                return data || NoopStore.useViewState(instanceId);
            }
        }
    }, [state]);
    return {
        useDispatch: () => dispatch,
        ...selectors
    }
}
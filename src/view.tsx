import React, {useCallback, useContext, useMemo} from "react";
import { ForestStore } from "./store";
import { RegionContext } from "./region";
import { ComponentRegistryContext } from "./forest-view";

const EMPTY_REGIONS = { };

const ViewContext = React.createContext("");
export const useViewContext = () => useContext(ViewContext);

const EmptyView = (_: any) => (<></>);

export type ForestViewProps = {
    instanceId: string,
    selectors: ForestStore
}
export const View : React.FC<ForestViewProps> = React.memo(({ instanceId, selectors }) => {
    const viewStateCallback = useCallback(() => {
        const {useViewState} = selectors;
        const viewState = useViewState(instanceId);
        const viewKey = `${(viewState && viewState.name) || ""} #${instanceId}`;
        return { viewState, viewKey, regions: viewState?.regions || EMPTY_REGIONS };
    }, [instanceId, selectors]);

    const { viewState, viewKey, regions } = viewStateCallback();

    type ModelWrapper = { model: any }
    const viewComponentCallback = useMemo(() => () => {
        return React.memo((w: ModelWrapper) => {
            var fn = ((viewState && ComponentRegistryContext.get(viewState.name)) || EmptyView);
            return fn(w.model);
        });
    }, [viewState]);

    const ViewComponent: React.FC<ModelWrapper> = viewComponentCallback();

    return (
        <ViewContext.Provider value={instanceId}>
            <RegionContext.Provider value={regions}>
                <ViewComponent key={viewKey} model={viewState?.model} />   
            </RegionContext.Provider>
        </ViewContext.Provider>
    );
});

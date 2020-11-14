import React, {useCallback, useContext, useMemo} from "react";
import { ForestStore } from "./hooks";
import { RegionContext } from "./region";
import { ComponentRegistryContext } from "./forest-view";

const EMPTY_REGIONS = { };

const ViewContext = React.createContext("");
export const useViewContext = () => useContext(ViewContext);

const EmptyView = React.memo((_: any) => <></>, () => true);

export type ForestViewProps = {
    instanceId: string,
    selectors: ForestStore
}
export const View : React.FC<ForestViewProps> = React.memo((props) => {
    const viewStateCallback = useCallback(() => {
        const {useViewState} = props.selectors;
        const viewState = useViewState(props.instanceId);
        const viewKey = `${(viewState && viewState.name) || ""} #${props.instanceId}`;
        return { viewState, viewKey, regions: viewState?.regions || EMPTY_REGIONS };
    }, [props.instanceId, props.selectors]);

    const { viewState, viewKey, regions } = viewStateCallback();

    type ModelWrapper = { model: any }
    const viewComponentCallback = useMemo(() => () => {
        return React.memo((w: ModelWrapper) => ((viewState && ComponentRegistryContext.get(viewState.name)) || EmptyView)(w.model));
    }, [viewState]);

    const ViewComponent: React.FC<ModelWrapper> = viewComponentCallback();

    if (!viewState) {
        console.log(`No viewstate`, props);
    }

    return (
        <ViewContext.Provider value={props.instanceId}>
            <RegionContext.Provider value={regions}>
                <ViewComponent key={viewKey} model={viewState?.model} />   
            </RegionContext.Provider>
        </ViewContext.Provider>
    );
});

import React, { ReactNode, memo, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
import { Region, RegionContext } from "./region";
import { ForestStore, ForestStoreContext, useNavigate } from "./hooks";
import { IForestClient, ForestResponse, NoopClient } from "@vdimensions/forest-js-frontend";
import { ForestClientContext } from "./client-context";
import { useForestReducerStore } from "./reducer-store";

type StoreProps = {
    store: ForestStore;
};

const createPopStateCallback = (navigate: { (path: string) : void }) => (e: any) => {
    if (e.state && e.state.state) {
        navigate(e.state.state.path);
    }
}

export const DefaultNavigator : React.FC<StoreProps> = memo((props) => { 
    return (
        <ForestStoreContext.Provider value={props.store}>
            {props.children}
        </ForestStoreContext.Provider>
    )
});

export const LocationNavigator : React.FC<StoreProps> = memo((props) => { 
    const {pathname, state} = useLocation();
    const {useDispatch} = props.store;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const popStateCallback = createPopStateCallback(navigate);
    useEffect(() => {
        window.addEventListener("popstate", popStateCallback);
        if (!state || !(state instanceof ForestResponse)) {
            navigate(pathname);
        }
        return () => {
            window.removeEventListener("popstate", popStateCallback);
        }
    }, [pathname, state, navigate, dispatch]);
    return (
        <Router>
            <Switch>
                <Route path="*">
                    <ForestStoreContext.Provider value={props.store}>
                        {props.children}
                    </ForestStoreContext.Provider>
                </Route>
            </Switch>
        </Router>
    )
});

const Shell: React.FC<StoreProps> = memo((props) => {
    const {useRootHierarchy} = props.store;
    const hierarchy = useRootHierarchy();
    return (
        <RegionContext.Provider value={hierarchy}>
            <Region name="" />
        </RegionContext.Provider>
    );
});

export type ForestAppProps = Partial<StoreProps> & {
    loadingIndicator: NonNullable<ReactNode>|null,
    client?: IForestClient,
    navigator?: React.FC<StoreProps>,
};
export const ForestApp: React.FC<ForestAppProps> = memo((props) => {
    const store = props.store || useForestReducerStore();
    const NavigatorComponent = (props.navigator || DefaultNavigator);
    return (
        <ForestClientContext.Provider value={props.client||NoopClient}>
          <NavigatorComponent store={store}>
            <Shell store={store} />
          </NavigatorComponent>
        </ForestClientContext.Provider>
    );
});
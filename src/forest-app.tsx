import React, { ReactNode, memo, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
import { Region, RegionContext } from "./region";
import { ForestStore, ForestStoreContext, useNavigate } from "./hooks";
import { IForestClient, ForestResponse, ForestHttpClient } from "@vdimensions/forest-js-frontend";
import { ForestClientContext } from "./client-context";
import { useForestReducerStore } from "./reducer-store";

type StoreProps = {
    store: ForestStore;
};

const Navigator : React.FC<StoreProps> = memo((props) => { 
    const {pathname, state} = useLocation();
    const {useDispatch} = props.store;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    useEffect(() => {
        if (state && state instanceof ForestResponse && state.path) {
            dispatch(state)
        } else {
            console.log("Navigating to path", pathname);
            navigate(pathname);
        }
    }, [pathname, state, navigate, dispatch]);
    return <React.Fragment />
});

const Shell: React.FC<StoreProps> = memo((props) => {
    const {useRootHierarchy} = props.store;
    const hierarchy = useRootHierarchy();
    console.log("ForestComponentTree", hierarchy);
    return (
        <RegionContext.Provider value={hierarchy}>
            <Region name="" />
        </RegionContext.Provider>
    );
});

export type ForestAppProps = Partial<StoreProps> & {
    loadingIndicator: NonNullable<ReactNode>|null,
    client?: IForestClient
};
export const ForestApp: React.FC<ForestAppProps> = memo((props) => {
    const store = props.store || useForestReducerStore();
    return (
        <ForestClientContext.Provider value={props.client||ForestHttpClient.create(window.location)}>
            <Router>
                <Switch>
                    <Route path="*">
                        <ForestStoreContext.Provider value={store}>
                            <Navigator store={store} />
                            <Shell store={store} />
                        </ForestStoreContext.Provider>
                    </Route>
                </Switch>
            </Router>
        </ForestClientContext.Provider>
    );
});
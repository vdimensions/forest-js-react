import React, { ReactNode, memo, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch, useHistory, useLocation } from "react-router-dom";
import ForestHooksContext, { DefaultForestHooks, ForestHooks, NoopForestResponseInterceptor, useNavigate } from "./hooks";
import { IForestClient, ForestResponse, NoopClient } from "@vdimensions/forest-js-frontend";
import { ForestClientContext } from "./client-context";
import ForestStoreContext, { ForestStore } from "./store";
import { useForestReducerStore } from "./store.reducer";
import { ensureStartSlash } from "./path";
import Shell from "./forest-shell";

type StoreProps = {
    store: ForestStore;
};
type NavigatorProps = {
    store: ForestStore;
    landingPage?: string
}

const createPopStateCallback = (navigate: { (path: string) : void }) => (e: any) => {
    if (e.state && e.state.state) {
        navigate(e.state.state.path);
    }
}

const DefaultNavigator : React.FC<NavigatorProps> = memo((props) => { 
    return (<ForestHooksContext.Provider value={DefaultForestHooks}>{props.children}</ForestHooksContext.Provider>)
});

export const LocationForestHooks: ForestHooks = {
    useNavigate: (interceptor) => {
        const i = (interceptor || NoopForestResponseInterceptor);
        const {replace} = useHistory();
        return DefaultForestHooks.useNavigate(
            x => {
                console.debug("LocationForestHooks intercepted navigate response for path ", x.path);
                replace(ensureStartSlash(x.path), x);
                return i(x);
            });
    },
    
    useCommand: ((command, interceptor) => {
        const i = (interceptor || NoopForestResponseInterceptor);
        const {push} = useHistory();
        return DefaultForestHooks.useCommand(
            command,
            x => {
                console.debug("LocationForestHooks intercepted command response for path ", x.path);
                push(ensureStartSlash(x.path), x);
                return i(x);
            });
    })
}

export const LocationNavigatorInner : React.FC<NavigatorProps> = memo((props) => { 
    const {pathname, state} = useLocation();
    const {useDispatch} = props.store;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const popStateCallback = createPopStateCallback(navigate);
    useEffect(() => {
        const p = (pathname || props.landingPage || "");
        window.addEventListener("popstate", popStateCallback);
        if (!state || !(state instanceof ForestResponse)) {
            console.debug("navigating to ", p);
            navigate(p);
        }
        return () => {
            window.removeEventListener("popstate", popStateCallback);
        }
    }, [pathname, state, navigate, dispatch]);
    return (<>{props.children}</>)
});
export const LocationNavigator : React.FC<NavigatorProps> = memo((props) => { 
    return (
        <ForestHooksContext.Provider value={LocationForestHooks}>
            <Router>
                <Switch>
                    <Route path="*">
                        <LocationNavigatorInner store={props.store} landingPage={props.landingPage}>
                            {props.children}
                        </LocationNavigatorInner>
                    </Route>
                </Switch>
            </Router>
        </ForestHooksContext.Provider>)
});



export type ForestAppProps = Partial<StoreProps> & {
    loadingIndicator: NonNullable<ReactNode>|null,
    client?: IForestClient,
    navigator?: React.FC<StoreProps>,
    landingPage?: string
};
export const ForestApp: React.FC<ForestAppProps> = memo((props) => {
    const NavigatorComponent = (props.navigator || DefaultNavigator);
    const defaultStore = useForestReducerStore();
    const store = (props.store || defaultStore);
    return (
        <ForestClientContext.Provider value={props.client||NoopClient}>
            <ForestStoreContext.Provider value={store}>
                <NavigatorComponent store={store} landingPage={props.landingPage}>
                    <Shell />
                </NavigatorComponent>
            </ForestStoreContext.Provider>
        </ForestClientContext.Provider>
    );
});
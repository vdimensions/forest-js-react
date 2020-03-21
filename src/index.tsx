import React, { Attributes, useContext, useEffect, useState } from 'react';
import * as Immutable from "immutable";
import * as Forest from "@vdimensions/forest-js";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import { Route, useHistory } from 'react-router';
import { History } from 'history';
import { useSelector, Provider } from 'react-redux';
import { AppContext } from '@vdimensions/forest-js';
import { createStore } from 'redux';

const AppStateContext = React.createContext(Forest.AppContext.empty());
const useAppContext = () => useContext(AppStateContext);

const RegionContext = React.createContext(Immutable.Map<string, string[]>());
const useRegionContext = () => useContext(RegionContext);


/** Component Registry Store Begin *******************************************/
interface FC<T = {}> extends React.FC<Forest.ViewContext<T>> { };
interface InternalFC<T = {}> extends React.FC<Forest.ViewState<T>> { };

const componentRegistry = (function() {
    let data = Immutable.Map<string, InternalFC>();
    return {
        get: (name: string) => data.get(name),
        set: (name: string, view: InternalFC<any>) => {
            data = data.set(name, view);
        }
    }
})();
/** Component Registry Store Begin *******************************************/

const renderViewStateItem = (x : Forest.ViewState<any> | null | undefined) => {
    let y = x && componentRegistry.get(x.name);
    if (x && y) {
        // generate an unique key for the created react element, as well as use the forest view name for meaningful representation in react dom.
        let enahncedInstance : Attributes & Forest.ViewState<any> = {key: x.name + " #" + x.instanceId, ...x};
        return React.createElement(y, enahncedInstance);
    } else if (x) {
        // TODO: error
        return (<React.Fragment key={(x && x.name && x.instanceId) ? x.name + " #" + x.instanceId : "null"}/>);
    }
};

const renderRegionContents = (appContext : Forest.AppContext, viewKeys: string[] | undefined) => {
    if (!viewKeys) {
        return (<></>);
    }
    const rootViews = viewKeys.map(k => appContext.state.instances.get(k));
    const items = rootViews.map(k => renderViewStateItem(k));
    return (
        <React.Fragment>
            {items}
        </React.Fragment>
    );
};

const deepEqual : (a: any, b: any) => boolean = require('deep-equal');
const defaultShouldComponentUpdate = <T extends {}> (prevProps: T, nextProps: T) => !deepEqual(prevProps, nextProps);

const ForestMemo = (component: React.FC<any>) => React.memo(component, (a, b) => !defaultShouldComponentUpdate(a, b));

export const RegisterComponent = <T extends {}>(name: string, component: FC<T>) => {
    const ForestComponent: InternalFC<T> & { whyDidYouRender: boolean } = (vs: Forest.ViewState<T>) => {
        const appContext = useAppContext();
        const ctx : Forest.ViewContext<T> = new Forest.ViewContext<T>(
            vs, 
            (name: string, arg?: any) => {
                appContext.engine.invokeCommand(vs.instanceId, name, arg);
            });
        const regions = Immutable.Map<string, string[]>(vs.regions);
        return (
            <RegionContext.Provider value={regions}>
                {component(ctx)}
            </RegionContext.Provider>
        );
    };
    ForestComponent.whyDidYouRender = true;
    
    const ForestComponentMemo : any = ForestMemo(ForestComponent);
    ForestComponentMemo.whyDidYouRender = ForestComponent.whyDidYouRender;
    componentRegistry.set(name, ForestComponentMemo);
    return ForestComponentMemo;
};

type RegionContentData = {
    name: string
}
const RegionComponent : React.FC<RegionContentData> & { whyDidYouRender : boolean } = (props: RegionContentData) => {
    const appContext = useAppContext();
    const regionContext: Immutable.Map<string, string[]> = useRegionContext();
    return renderRegionContents(appContext, regionContext.get(props.name));
};
RegionComponent.whyDidYouRender = true;
export const Region = React.memo(RegionComponent, defaultShouldComponentUpdate);

export type ForestConfig = {
    initialTemplate: string,
    client: Forest.IForestClient,
    store?: any
}

type ExtendedConfig = {
    initialTemplate: string,
    client: Forest.IForestClient,
    store?: any,
    selector: any
}

function createFallbackStore() {
    const noopReducer = (state: any) => {
        return state;
    };
    return createStore(noopReducer, {});
}

const useForest = (cfg: ExtendedConfig) => {
    const history: History<any> = useHistory();
    const appContext: AppContext = useSelector(cfg.selector);
    const [isBackButtonPressed, setBackbuttonPressed] = useState(false);
    const backButtonOn = () => {
        setBackbuttonPressed(true);
    };
    useEffect(() => {
        window.addEventListener('popstate', backButtonOn);
        if (appContext) {
            const urlTemplate = (window.location.pathname && window.location.pathname.substr(1).replace(/\/$/, ""));
            const navFromApp = appContext.state ? appContext.state.template : '', 
            //    navFromLoc = urlTemplate,//location.state ? location.state.template : '', 
                navFromUrl = urlTemplate;
            let isServerSideNavigate = false;
            let targetLocation = '';
            if (!navFromApp) {
                // initial load
                targetLocation = (navFromUrl || cfg.initialTemplate);
            } else if (/*navFromLoc === navFromUrl && */navFromUrl !== navFromApp) {
                // possible server-side navigate
                targetLocation = isBackButtonPressed ? navFromUrl : navFromApp;
                isServerSideNavigate = !isBackButtonPressed;
            //} else if (/*navFromLoc === navFromApp && */navFromApp !== navFromUrl) {
            //    // user navigate
            //    targetLocation = navFromUrl;
            }

            if (!isBackButtonPressed) {
                if (targetLocation) {
                    if (isServerSideNavigate) {
                        history.push(appContext.state.template, appContext.state);
                    } else {
                        appContext.engine.navigate(targetLocation).then((appContext: AppContext | undefined) => {
                            if (!appContext) {
                                return;
                            }
                            history.push(appContext.state.template, appContext.state);
                        });
                    }   
                }
            } else if (history.location.state) {
                appContext.engine.navigate(history.location.state.template);
                history.goBack();
            }
            setBackbuttonPressed(false);
        }
        return () => {
            window.removeEventListener('popstate', backButtonOn);
        }
    },
    [history, appContext, cfg, isBackButtonPressed]);
    return appContext;
};

const Template : React.FC<ExtendedConfig> & { whyDidYouRender : boolean } = (config) => {
    let appContext = useForest(config);
    return (
        <AppStateContext.Provider value={appContext}>
            {renderRegionContents(appContext, ((appContext && appContext.state.hierarchy.get("")) || []))}
        </AppStateContext.Provider>
    );
};
Template.whyDidYouRender = true;

export const Shell : React.FC<ForestConfig> = (config) => {
    let cfg = {...config };
    if (!cfg.store) {
        cfg = { ...cfg, store: createFallbackStore() };
    }
    const engineSelector = Forest.CreateEngine(cfg.client, cfg.store);
    const extendedCfg = {...cfg, selector: engineSelector}
    return (
        <Provider store={cfg.store}>
            <Router>
                <Switch>
                    <Route path="*">
                        <Template {...extendedCfg} />
                    </Route>
                </Switch>
            </Router>
        </Provider>
    );
};
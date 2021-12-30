import { createContext, useCallback, useContext } from "react";
import { useHistory } from "react-router-dom";
import { ForestResponse, Command } from "@vdimensions/forest-js-frontend";
import { useForestClient } from "./client-context";
import { useViewContext } from "./view";
import { EMPTY_FOREST_RESPONSE, useForestSelectors } from "./store";

interface ForestReactCommand extends Command {
    invoke: (arg?: any) => void;
}
export type TForestReactCommand = ForestReactCommand;

export type ForestResponseInterceptor = { (resp: ForestResponse) : ForestResponse };
export const NoopForestResponseInterceptor: ForestResponseInterceptor = (resp) => resp;

export type ForestHooks = {
    useNavigate: { (interceptor?: ForestResponseInterceptor) : { (template: string) : void } },
    useCommand: { (command: string, interceptor?: ForestResponseInterceptor) : TForestReactCommand }
}

export const NoopForestHooks : ForestHooks = {
    useNavigate: (_) => (_: string) => { },
    useCommand: (_: string) => ({ invoke: (_?: any) => {}, name: "", path: "", description: "", displayName: "", tooltip: "" }),
}

export const ForestHooksContext = createContext<ForestHooks>(NoopForestHooks);
const useForestHooks = () => useContext(ForestHooksContext);

export const useNavigate = () => {
    const {useNavigate} = useForestHooks();
    return useNavigate();
}

export const useCommand = (command: string) => {
    const {useCommand} = useForestHooks();
    return useCommand(command);
}

export const DefaultForestHooks: ForestHooks = {
    useNavigate: (interceptor) => {
        const {useDispatch} = useForestSelectors();
        const dispach = useDispatch();
        const client = useForestClient();
        const i = (interceptor || NoopForestResponseInterceptor);
        return useCallback((template: string) => {
            console.debug("DefaultForestHooks navigating to ", template);
            client
                .navigate(template)
                .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
                .then(i)
                .then(dispach);
        }, [client, dispach, i]);
    },
    
    useCommand: ((command, interceptor) => {
        const {useDispatch, useViewState} = useForestSelectors();
        const dispach = useDispatch();
        const {push, replace} = useHistory();
        const client = useForestClient();
        const instanceId = useViewContext();
        const viewState = useViewState(instanceId);
        const cmd: Command|undefined = viewState?.commands[command];
        const path = cmd?.path || "";
        const i = (interceptor || NoopForestResponseInterceptor);
        const invoke = useCallback((arg?: any) => {
            if (path) {
                client
                    .navigate(path)
                    .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
                    .then(i)
                    .then(dispach);
            } else {
                client
                    .invokeCommand(instanceId, command, arg)
                    .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
                    .then(i)
                    .then(dispach);
            }
        }, [command, instanceId, path, client, dispach, push, replace, i]);
        return {
            invoke,
            name: command,
            path: path,
            description: cmd?.description || "",
            displayName: cmd?.displayName || "",
            tooltip: cmd?.tooltip || ""
        }
    })
}


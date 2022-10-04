import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type PStoreCallback<T> = (obj: T|undefined) => void;

export const pstore = <T>(key: string, init?: T) => {
    const subscribers = new Set<PStoreCallback<T>>();

    const value = () => {
        const found = localStorage.getItem(key);
        if (found != null) {
            return JSON.parse(found);
        }
    }

    let current = value() || init;

    const subscribe = (cb: PStoreCallback<T>) => {
        subscribers.add(cb);
        cb(current);

        return () => { subscribers.delete(cb); }
    }

    const notifyAll = () => {
        for (const sub of subscribers) {
            sub(current);
        }
    }

    const set = (value: T) => {
        current = value;
        localStorage.setItem(key, JSON.stringify(value));
        notifyAll();
    }

    const clear = () => set(undefined);

    return {
        clear,
        value,
        subscribe,
        set,
    }
}



import type { UserRole } from '@/app/features/users/models/User'


export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>


export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>


export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
}


export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}


export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}


export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never
}[keyof T]


export type StringKeys<T> = KeysOfType<T, string>


export type NumberKeys<T> = KeysOfType<T, number>


export type BooleanKeys<T> = KeysOfType<T, boolean>


export type Nullable<T> = {
    [P in keyof T]: T[P] | null
}


export type AnyFunction = (...args: unknown[]) => unknown


export type Async<T extends AnyFunction> = (
    ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>


export type ElementType<T> = T extends (infer E)[] ? E : never


export type UnionToIntersection<U> = 
    (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void 
        ? I 
        : never


export type LastOfUnion<T> = UnionToIntersection<
    T extends unknown ? () => T : never
> extends () => infer R
    ? R
    : never


export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>


export type StrictPick<T, K extends keyof T> = Pick<T, K>

// Forum API specific utility types


export type NonAdminRole = Exclude<UserRole, 'admin'>


export type ElevatedRole = Exclude<UserRole, 'user'>

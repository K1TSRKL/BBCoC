type AssetName = string;
type LayerName = string;
type GlobalCompositeOperation = string;

/** Nested records for dumping data across all layers, assets and groups */
declare namespace JSONMapping {
    declare namespace Template {
        type Layer<T> = Record<AssetGroupName, Record<AssetName, Record<LayerName, T>>>;
        type Asset<T> = Record<AssetGroupName, Record<AssetName, T>>;
        type Group<T> = Record<AssetGroupName, T>;
    }
    type Layer<T extends keyof AssetLayer> = Template.Layer<AssetLayer[T]>;
    type Asset<T extends keyof Asset> = Template.Asset<Asset[T]>;
    type Group<T extends keyof AssetGroup> = Template.Group<AssetGroup[T]>;
}

/** Records for displaying the diff between layer/asset/group properties */
declare namespace DiffEntry {
    // Diff types appropriate for scalar-, array- and record-based types
    type Record<T extends { readonly [key: string]: any }> = { [k in keyof T]: { "+": Required<T>[k], "-": Required<T>[k] } };
    type List<T extends readonly any[]> = { "+": T[number], "-": T[number] }[];
    type Scalar<T> = { "+": T, "-": T };

    // Make all keys required and remove null-based values
    type _Layer = { [P in keyof AssetLayer]-?: NonNullable<AssetLayer[P]> };
    type _Asset = { [P in keyof globalThis.Asset]-?: NonNullable<globalThis.Asset[P]> };
    type _Group = { [P in keyof AssetGroup]-?: NonNullable<AssetGroup[P]> };

    // Apply a diff type appropriate for each scalar-, array- and record-based properties
    type Layer = {
        [k in keyof _Layer as k]:
        _Layer[k] extends number | string | boolean ? Scalar<_Layer[k]> : (
            _Layer[k] extends readonly any[] ? List<_Layer[k]> : (
                _Layer[k] extends { readonly [key: string]: any } ? Record<_Layer[k]> : never
            )
        )
    };
    type Asset = {
        [k in keyof _Asset as k]:
        _Asset[k] extends number | string | boolean ? Scalar<_Asset[k]> : (
            _Asset[k] extends readonly any[] ? List<_Asset[k]> : (
                _Asset[k] extends { readonly [key: string]: any } ? Record<_Asset[k]> : never
            )
        )
    };
    type Group = {
        [k in keyof _Group as k]:
        _Group[k] extends number | string | boolean ? Scalar<_Group[k]> : (
            _Group[k] extends readonly any[] ? List<_Group[k]> : (
                _Group[k] extends { readonly [key: string]: any } ? Record<_Group[k]> : never
            )
        )
    };
}

/** Nested records for displaying the diff between layer/asset/group properties across all layers, assets and groups */
declare namespace DiffMapping {
    type Layer<T extends keyof AssetLayer> = Partial<JSONMapping.Template.Layer<DiffEntry.Layer[T]>>;
    type Asset<T extends keyof globalThis.Asset> = Partial<JSONMapping.Template.Asset<DiffEntry.Asset[T]>>;
    type Group<T extends keyof AssetGroup> = Partial<JSONMapping.Template.Group<DiffEntry.Group[T]>>;
}

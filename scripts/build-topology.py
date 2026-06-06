#!/usr/bin/env python3
"""Convert a viewerTop.json + viewerFrame*.json pair from the F@H client
into the topology JSON consumed by HeroProteinViewer.client.vue.

Usage:
  build-topology.py <viewerTop.json> <viewerFrame0.json> [viewerFrame1.json ...] -o <out.json>

Filters out unbonded atoms (counter-ions and force-field virtual sites) and
re-indexes bonds. Without this, the F@H client topology renders with 100+
stray atoms floating far outside the protein body.
"""
import argparse, json, sys


def load_topology(path):
    with open(path) as f:
        d = json.load(f)
    return d['atoms'], d['bonds'], d.get('units')


def load_frame(path):
    with open(path) as f:
        return json.load(f)


def filter_unbonded(atoms, bonds, frames):
    # Build adjacency list.
    bonded = [False] * len(atoms)
    for a, b in bonds:
        bonded[a] = True
        bonded[b] = True

    # Map old index -> new index for kept atoms.
    new_index = {}
    new_atoms = []
    for i, atom in enumerate(atoms):
        if bonded[i]:
            new_index[i] = len(new_atoms)
            new_atoms.append(atom)

    new_bonds = [[new_index[a], new_index[b]] for a, b in bonds
                 if a in new_index and b in new_index]

    new_frames = [[frame[i] for i in range(len(atoms)) if i in new_index]
                  for frame in frames]
    return new_atoms, new_bonds, new_frames


def main():
    p = argparse.ArgumentParser()
    p.add_argument('topology')
    p.add_argument('frames', nargs='+')
    p.add_argument('-o', '--output', required=True)
    args = p.parse_args()

    atoms, bonds, units = load_topology(args.topology)
    frames = [load_frame(f) for f in args.frames]

    print(f'in : {len(atoms)} atoms, {len(bonds)} bonds, {len(frames)} frames',
          file=sys.stderr)
    atoms, bonds, frames = filter_unbonded(atoms, bonds, frames)
    print(f'out: {len(atoms)} atoms, {len(bonds)} bonds (filtered unbonded)',
          file=sys.stderr)

    out = {
        'units':    units,
        'topology': {'atoms': atoms, 'bonds': bonds},
        'frames':   frames,
    }
    with open(args.output, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    print(f'wrote {args.output}', file=sys.stderr)


if __name__ == '__main__':
    main()

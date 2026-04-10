You're opening a merge request to BondageProject's BondageClub project, and we have a couple prerequisites:

- its title will end up in the changelog for the release

If you're adding assets, something like `Adds a new thing, a glorb and a foo` would be enough.
If you have additional credits because it's a combined project, state so in the description.

Please make it as clear, concise, and high-level as possible, given that's most of the readers
want from the changelog. If you have technical details, those stay in the description.

- please check CI before opening

We have a bot that runs various checks on incoming MRs and catches issues early (which is nice).
But GitGud has it under a whitelist, so if you're a new contributor it won't get run (which is
sad). Thankfully, you can run those checks locally yourself using the following steps, provided
you have access to a shell:

```sh
# only needs to happen once in a while; this requires Node to be installed
npm install
# runs the same script the CI bot runs
npm run checks
```

This will give you the same message a CI run here will, pointing out at issues with asset
configuration and whitespace. If you get any questions about what it means, or are struggling to
run the checks, ask for help in BC's #programming Discord channel.

In case of whitespace errors, you can additionally run
```sh
npm run assets:lint:fix scripts:lint:fix
```
which will automatically fix most of them for you, so you only need to commit those afterwards.

Thank you for your contribution!

>8 >8 >8 >8 >8 All lines above this can be deleted once read 8< 8< 8< 8< 8<

%{first_multiline_commit}
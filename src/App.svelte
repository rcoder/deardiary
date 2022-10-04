<script lang="ts">
  import 'sanitize.css';

  import { pstore } from './lib/persist';

  const APP = 'deardiary';
  const VERSION = '0.1.0';
  const URL_STORE_KEY = `${APP}__${VERSION}__connect-url`;

  let dark = false;
  let useRegex = true;

  let style: string;
  let inverseStyle: string;

  let baseUrl = pstore(URL_STORE_KEY, 'http://localhost:19531');

  let connected = false;

  let hostData: Record<string, string>;

  const defaultStyle = (invert) => `
    background: var(${invert ? '--bg-dark' : '--bg-light'});
    color: var(${invert ? '--txt-light' : '--txt-dark'});
  `;

  const get = async (url: string) => {
    console.log(`get`, { url });
    const options = {
        headers: {
            accept: 'application/json',
        },
        type: 'cors',
    };

    let res = await fetch(url, options);

    if (res.url) {
        res = await fetch(res.url, options);
    }

    return await res.text();
  }

  const connect = async () => {
    const url = $baseUrl + `/machine`;
    hostData = JSON.parse(await get(url));

    connected = true;
  }

  let units: string[] = [];
  let logData: Record<string, string>[] = [];
  let selected: string;

  const getLogData = async () => {
    const url = $baseUrl + `/entries`;
    const res = await get(url);
    units = [];
    logData = {};

    for (const line of res.split('\n')) {
        try {
            const entry = JSON.parse(line);
            const unit = entry['_SYSTEMD_UNIT'];
            const message = entry['MESSAGE'];
            const time = entry['_SOURCE_REALTIME_TIMESTAMP'] ||
                entry['__REALTIME_TIMESTAMP'];

            if (unit && message) {
                const found = logData[unit] || [];
                found.push({ unit, time, message });
                logData[unit] = found;
                units = [...new Set([unit, ...units])];
            }
        } catch (e) { console.error(e); }
    }

    units.sort((a, b) => b.toLowerCase() < a.toLowerCase());
  }

  $: connected && getLogData();

  $: console.log({ logData });
  $: style = defaultStyle(dark);
  $: inverseStyle = defaultStyle(!dark);
</script>

<main {style}>
    <div class="toolbar" style={inverseStyle}>
        <div class="sw-ident">{APP}: {VERSION}</div>

        <div class="host-options">
            <input type="text"
                bind:value={$baseUrl}
                on:change={() => { connected = false; }}
                size="25">
            <button type="button"
                on:click={connect}
                disabled={connected}
                style={inverseStyle}>
                Connect
            </button>
        </div>

        <div class="general-options">
            <label>
                <input type="checkbox" bind:checked={dark} />
                dark mode
            </label>
            <label>
                <input type="checkbox" bind:checked={useRegex} />
                regex match
            </label>
        </div>
    </div>

    <div class="content">
        {#if connected}
        <h3>Connected to {$baseUrl}</h3>
        <table>
            <thead style={inverseStyle}>
                <tr>
                    <th>host</th>
                    <th>os</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{hostData.hostname}</td>
                    <td>{hostData.os_pretty_name}</td>
                </tr>
            </tbody>
        </table>
        {/if}

        {#if units.length > 0}
        <h3>Available Units</h3>
        <select bind:value={selected}>
            <option disabled selected value>---</option>
            {#each units as unit}
            <option value={unit}>{unit}</option>
            {/each}
        </select>
        {/if}

        {#if selected}
        <h3>Entries for {selected}</h3>
        <table>
            <thead style={inverseStyle}>
                <tr>
                    <th>time</th>
                    <th>message</th>
                </tr>
            </thead>
            <tbody>
                {#each logData[selected] as entry}
                <tr>
                    <td class="timestamp-cell">{entry.time}</td>
                    <td>{entry.message}</td>
                </tr>
                {/each}
            </tbody>
        </table>
        {/if}
    </div>
</main>

<style>
    :global(:root) {
        font-family: var(--txt-font-default);
        font-size: var(--txt-size-base);
    }

    main {
        min-height: 100vh;
        margin: 0px;
    }

    .toolbar {
        font-size: 90%;
        padding: 1rem;
        background-color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    select {
        font-size: var(--txt-size-base);
    }

    .sw-ident {
        font-weight: bold;
    }

    .content {
        padding: 1rem;
    }

    .content table {
        width: 100%;
        border-collapse: collapse;
    }

    .content table th, .content table td {
        text-align: left;
        padding-right: 0.5rem;
        padding-left: 0.5rem;
        word-wrap: break-word;
    }

    .toolbar button {
        border: 1px solid #fff;
        margin-left: 0.5rem;
    }
</style>

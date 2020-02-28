import peer_store from './peer-store.mjs';
import { mount, html } from 'templating/def-context.mjs';

mount(html`${peer_store}`, document.body);
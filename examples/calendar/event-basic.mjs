"use strict";

export default class EventBasic extends HTMLElement {
	constructor() {
		super();

		// attach a shadow root
		this.attachShadow({ mode: 'open' });
	}
	connectedCallback() {
		this.shadowRoot.innerHTML = `
		<link rel="stylesheet" href="css/event-basic.css">
		overriding`;
	}
}

customElements.define('event-basic', EventBasic, {});
import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import { single } from '../../src/straw-react/single.mjs';
import { use } from '../../src/straw-react/use.mjs';
import list from '../../src/straw-react/list.mjs';
import { push_context, pop_context } from '../../src/straw-react/context.mjs';
import apply_expression from '../../src/template-v2/apply-expression.mjs';

function todo_mvc() {
	return html`
		<section class="todoapp">
			<header class="header">
				<h1>todos</h1>
				<input class="new-todo" placeholder="What needs to be done?" autofocus>
			</header>
			<section class="main">
				<input id="toggle-all" class="toggle-all" type="checkbox">
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list"></ul>
			</section>
			<footer class="footer">
				<span class="todo-count"></span>
				<ul class="filters">
					<li>
						<a href="#/" class="selected">All</a>
					</li>
					<li>
						<a href="#/active">Active</a>
					</li>
					<li>
						<a href="#/completed">Completed</a>
					</li>
				</ul>
				<button class="clear-completed">Clear completed</button>
			</footer>
		</section>
	`;
}


mount(todo_mvc());
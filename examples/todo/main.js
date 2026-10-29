import { Region, View } from 'marionette';
import LitDomApi from '@mnjs/adapters/dom/lit-html';
import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';

const TodoView = View.extend({
  initialize() {
    this.tasks = [];
    this.filter = 'all';
    this.nextId = 1;
    this.composing = false;
  },
  templateContext() {
    return {
      tasks: this.tasks.filter(task => this.filter === 'all' ||
        (this.filter === 'completed' ? task.done : !task.done)),
      completed: this.tasks.filter(task => task.done).length,
      total: this.tasks.length,
      filter: this.filter,
    };
  },
  template: ({ tasks, completed, total, filter }) => html`
    <h1>待办清单</h1>
    <p><small>Companion exercise · synthetic data only · refresh resets this demo.</small></p>
    <form>
      <label>新任务 <input name="draft" type="text" autocomplete="off"></label>
      <button type="submit">添加</button>
    </form>
    <p role="status" aria-live="polite">已完成 ${completed} / 共 ${total} 项</p>
    <nav aria-label="筛选">
      ${[['all', '全部'], ['active', '未完成'], ['completed', '已完成']].map(([key, label]) => html`
        <button type="button" data-filter=${key} aria-pressed=${String(filter === key)}>${label}</button>
      `)}
    </nav>
    <ul aria-label="任务">
      ${repeat(tasks, task => task.id, task => html`
        <li><label><input type="checkbox" data-id=${task.id} .checked=${task.done}> <span>${task.title}</span></label></li>
      `)}
    </ul>
    ${tasks.length ? '' : html`<p class="empty">暂无匹配任务</p>`}
  `,
  events: {
    'submit form': 'addTask',
    'change input[data-id]': 'toggleTask',
    'click button[data-filter]': 'selectFilter',
    'compositionstart input[name=draft]': 'startComposition',
    'compositionend input[name=draft]': 'endComposition',
    'keydown input[name=draft]': 'guardComposition',
  },
  startComposition() { this.composing = true; },
  endComposition() { this.composing = false; },
  guardComposition(event) {
    if (event.key === 'Enter' && (this.composing || event.isComposing || event.keyCode === 229)) {
      event.preventDefault();
    }
  },
  addTask(event) {
    event.preventDefault();
    if (this.composing) return;
    const input = this.el.querySelector('input[name=draft]');
    const title = input.value.trim();
    if (!title) return;
    this.tasks.push({ id: this.nextId++, title, done: false });
    // The draft input has no template value binding. Lit retains its node/value
    // across list/filter updates; clear it only after a successful submission.
    input.value = '';
    this.render();
    input.focus();
  },
  toggleTask(event) {
    const input = event.delegateTarget;
    const task = this.tasks.find(item => item.id === Number(input.dataset.id));
    task.done = input.checked;
    this.render();
    // A filtered-out checkbox loses focus; move it to the selected filter.
    if (!input.isConnected) this.el.querySelector('button[aria-pressed=true]').focus();
  },
  selectFilter(event) {
    this.filter = event.delegateTarget.dataset.filter;
    this.render();
  },
}).setDomApi(LitDomApi);

const region = new Region({ el: '#app' });
region.show(new TodoView());

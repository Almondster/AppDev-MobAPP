import { clone, findUserByUid, getTable, nextId } from '@/frontend/seed';

type QueryResult = {
  data: any;
  error: any;
  count?: number | null;
};

const deepClone = <T>(value: T): T => clone(value);

const parsePrimitive = (value: any) => {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && trimmed !== '') {
    return numeric;
  }
  return trimmed;
};

const splitTopLevel = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

const compare = (actual: any, operator: string, expected: any) => {
  if (operator === 'eq') return actual === expected;
  if (operator === 'is') return actual === expected;
  if (operator === 'gt') return actual > expected;
  if (operator === 'gte') return actual >= expected;
  if (operator === 'lt') return actual < expected;
  if (operator === 'lte') return actual <= expected;
  if (operator === 'ilike') {
    const text = String(actual || '').toLowerCase();
    const pattern = String(expected || '').toLowerCase().replace(/%/g, '');
    return text.includes(pattern);
  }
  if (operator === 'in') {
    return Array.isArray(expected) ? expected.includes(actual) : false;
  }
  return true;
};

const buildCondition = (expression: string): ((row: Record<string, any>) => boolean) => {
  const andMatch = expression.match(/^and\((.*)\)$/);
  if (andMatch) {
    const inner = splitTopLevel(andMatch[1]).map(buildCondition);
    return (row) => inner.every((condition) => condition(row));
  }

  const parsed = expression.match(/^([^.]+)\.(eq|is|gt|gte|lt|lte|ilike)\.(.*)$/);
  if (!parsed) {
    return () => true;
  }

  const [, field, operator, rawValue] = parsed;
  const expected = parsePrimitive(rawValue);
  return (row) => compare(row[field], operator, expected);
};

const parseInList = (value: any) => {
  if (Array.isArray(value)) {
    return value;
  }

  const raw = String(value || '').trim();
  if (!raw.startsWith('(') || !raw.endsWith(')')) {
    return [parsePrimitive(raw)];
  }

  const inner = raw.slice(1, -1);
  return splitTopLevel(inner).map(parsePrimitive);
};

const enrichRows = (table: string, rows: Record<string, any>[]) => {
  if (table === 'services') {
    return rows.map((row) => {
      const user = findUserByUid(row.creator_id);
      return {
        ...row,
        users: user ? deepClone(user) : null,
        creator: user ? deepClone(user) : null,
      };
    });
  }

  if (table === 'users') {
    const creators = getTable('creators');
    return rows.map((row) => ({
      ...row,
      creators: creators.filter((creator) => creator.user_id === row.firebase_uid).map(deepClone),
    }));
  }

  if (table === 'creators') {
    return rows.map((row) => ({
      ...row,
      users: findUserByUid(row.user_id),
    }));
  }

  if (table === 'reviews') {
    return rows.map((row) => ({
      ...row,
      reviewer: findUserByUid(row.reviewer_id),
    }));
  }

  if (table === 'follows') {
    return rows.map((row) => ({
      ...row,
      users: findUserByUid(row.follower_id),
      following: findUserByUid(row.following_id),
    }));
  }

  return rows;
};

class LocalChannel {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  on(_eventType: string, _config: Record<string, any>, _callback: (...args: any[]) => void) {
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    return this;
  }
}

class LocalQueryBuilder implements PromiseLike<any> {
  private table: string;
  private filters: Array<(row: Record<string, any>) => boolean> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectOptions: { count?: string; head?: boolean } = {};
  private insertPayload: Record<string, any>[] = [];
  private updatePayload: Record<string, any> = {};
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*', options: { count?: string; head?: boolean } = {}) {
    this.selectOptions = options;
    return this;
  }

  insert(values: Record<string, any> | Record<string, any>[]) {
    this.mode = 'insert';
    this.insertPayload = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: Record<string, any>) {
    this.mode = 'update';
    this.updatePayload = values;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') {
      const list = parseInList(value);
      this.filters.push((row) => !list.includes(row[column]));
      return this;
    }

    if (operator === 'is') {
      this.filters.push((row) => row[column] !== value);
      return this;
    }

    this.filters.push(() => true);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  ilike(column: string, value: string) {
    const pattern = value.toLowerCase().replace(/%/g, '');
    this.filters.push((row) => String(row[column] || '').toLowerCase().includes(pattern));
    return this;
  }

  or(expression: string) {
    const conditions = splitTopLevel(expression).map(buildCondition);
    this.filters.push((row) => conditions.some((condition) => condition(row)));
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this.execute();
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this.execute();
  }

  private getFilteredRows(): Record<string, any>[] {
    const baseRows: Record<string, any>[] = enrichRows(this.table, getTable(this.table) as Record<string, any>[]).map((row) => deepClone(row));
    let rows: Record<string, any>[] = baseRows.filter((row) => this.filters.every((filter) => filter(row)));

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = rows.sort((left: Record<string, any>, right: Record<string, any>) => {
        if (left[column] === right[column]) return 0;
        if (left[column] == null) return 1;
        if (right[column] == null) return -1;
        if (left[column] > right[column]) return ascending ? 1 : -1;
        return ascending ? -1 : 1;
      });
    }

    return rows;
  }

  private async executeSelect(): Promise<QueryResult> {
    const filtered = this.getFilteredRows();
    const count = this.selectOptions.count === 'exact' ? filtered.length : null;
    const rows = this.limitValue != null ? filtered.slice(0, this.limitValue) : filtered;

    if (this.selectOptions.head) {
      return { data: null, error: null, count };
    }

    if (this.singleMode) {
      return { data: rows[0] || null, error: null, count };
    }

    return { data: rows, error: null, count };
  }

  private async executeInsert(): Promise<QueryResult> {
    const table = getTable(this.table);
    const inserted = this.insertPayload.map((row) => {
      const normalized = {
        id: typeof row.id === 'undefined' ? nextId(this.table) : row.id,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
        ...row,
      };
      table.push(normalized);
      return deepClone(normalized);
    });

    if (this.singleMode) {
      return { data: inserted[0] || null, error: null, count: null };
    }

    return { data: inserted, error: null, count: null };
  }

  private async executeUpdate(): Promise<QueryResult> {
    const table = getTable(this.table);
    const updated: Record<string, any>[] = [];

    table.forEach((row, index) => {
      if (this.filters.every((filter) => filter(row))) {
        table[index] = { ...row, ...this.updatePayload, updated_at: new Date().toISOString() };
        updated.push(deepClone(table[index]));
      }
    });

    if (this.singleMode) {
      return { data: updated[0] || null, error: null, count: updated.length };
    }

    return { data: updated, error: null, count: updated.length };
  }

  private async executeDelete(): Promise<QueryResult> {
    const table = getTable(this.table);
    const deleted: Record<string, any>[] = [];

    for (let index = table.length - 1; index >= 0; index -= 1) {
      if (this.filters.every((filter) => filter(table[index]))) {
        deleted.push(deepClone(table[index]));
        table.splice(index, 1);
      }
    }

    if (this.singleMode) {
      return { data: deleted[0] || null, error: null, count: deleted.length };
    }

    return { data: deleted.reverse(), error: null, count: deleted.length };
  }

  private execute() {
    if (this.mode === 'insert') return this.executeInsert();
    if (this.mode === 'update') return this.executeUpdate();
    if (this.mode === 'delete') return this.executeDelete();
    return this.executeSelect();
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled || undefined, onrejected || undefined);
  }
}

export const frontendStore: any = {
  from(table: string) {
    return new LocalQueryBuilder(table);
  },
  rpc(name: string, params: Record<string, any> = {}) {
    if (name === 'get_creator_dashboard_stats') {
      const creatorId = params.target_user_id;
      const orders = getTable('orders').filter((order) => order.creator_id === creatorId);
      const activeProjects = orders.filter((order) => ['pending', 'accepted', 'in_progress', 'delivered', 'active'].includes(order.status)).length;
      const completedOrders = orders.filter((order) => order.status === 'completed');
      const lastMonthEarnings = completedOrders.reduce((total, order) => total + (parseFloat(String(order.price || 0)) || 0), 0);
      return Promise.resolve({
        data: [
          {
            total_views: 128,
            total_clicks: 41,
            today_views: 9,
            today_clicks: 4,
            active_projects: activeProjects,
            last_month_earnings: lastMonthEarnings,
          },
        ],
        error: null,
      });
    }

    return Promise.resolve({ data: true, error: null });
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, _body: any, _options?: Record<string, any>) {
          return { data: { path, bucket }, error: null };
        },
        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `https://mock-storage.local/${bucket}/${path}`,
            },
          };
        },
      };
    },
  },
  channel(name: string) {
    return new LocalChannel(name);
  },
  removeChannel(_channel: LocalChannel) {
    return Promise.resolve({ error: null });
  },
};

export const supabase = frontendStore;

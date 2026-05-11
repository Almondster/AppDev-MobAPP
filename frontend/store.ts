import { clone, ensureUserRecord, findUserByUid, getTable, nextId } from '@/frontend/seed';
import * as api from '@/frontend/api';

type QueryResult = {
  data: any;
  error: any;
  count?: number | null;
};

const deepClone = <T>(value: T): T => clone(value);

// Map table names to API endpoints
const TABLE_FETCH_MAP: Record<string, (params?: Record<string, any>) => Promise<any>> = {
  users: api.fetchUsers,
  creators: api.fetchCreators,
  services: api.fetchServices,
  orders: api.fetchOrders,
  categories: api.fetchCategories,
  reviews: api.fetchReviews,
  messages: api.fetchMessages,
  follows: api.fetchFollows,
  blocks: api.fetchBlocks,
  reports: api.fetchReports,
  matches: api.fetchMatches,
  'payment_methods': api.fetchPaymentMethods,
  'support_tickets': api.fetchSupportTickets,
  'user_wallets': api.fetchWallets,
  withdrawals: api.fetchWithdrawals,
  'order_timeline': api.fetchOrderTimeline,
  'deadline_notifications': api.fetchDeadlineNotifications,
  'daily_analytics': api.fetchDailyAnalytics,
};

const TABLE_CREATE_MAP: Record<string, (body: Record<string, any>) => Promise<any>> = {
  services: api.createService,
  orders: api.createOrder,
  reviews: api.createReview,
  messages: api.sendMessage,
  follows: api.createFollow,
  blocks: api.createBlock,
  reports: api.createReport,
  matches: api.createMatch,
  'payment_methods': api.createPaymentMethod,
  'support_tickets': api.createSupportTicket,
  'user_wallets': api.createWallet,
  withdrawals: api.createWithdrawal,
};

const TABLE_UPDATE_MAP: Record<string, (id: string | number, body: Record<string, any>) => Promise<any>> = {
  users: api.updateUser,
  creators: api.updateCreator,
  services: api.updateService,
  orders: api.updateOrder,
  reviews: api.updateReview,
  messages: api.updateMessage,
  matches: api.updateMatch,
  'support_tickets': api.updateSupportTicket,
  'user_wallets': api.updateWallet,
};

const TABLE_DELETE_MAP: Record<string, (id: string | number) => Promise<any>> = {
  services: api.deleteService,
  follows: api.deleteFollow,
  blocks: api.deleteBlock,
  'payment_methods': api.deletePaymentMethod,
  'user_wallets': api.deleteWallet,
};

const idString = (value: any) => (value == null ? value : String(value));

const splitName = (name: string | null | undefined) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' '),
  };
};

const normalizeRow = (table: string, row: Record<string, any>) => {
  if (!row) return row;

  if (table === 'users') {
    const fullName = row.full_name || row.username || row.email?.split('@')[0] || 'User';
    const normalized = {
      ...row,
      id: row.id ?? row.firebase_uid,
      firebase_uid: idString(row.firebase_uid || row.id),
      full_name: fullName,
      username: row.username || fullName,
      ...splitName(fullName),
    };
    ensureUserRecord(normalized);
    return normalized;
  }

  if (table === 'creators') {
    const normalizedUser = row.user ? normalizeRow('users', row.user) : findUserByUid(idString(row.user_id));
    return {
      ...row,
      user_id: idString(row.user_id),
      skills: typeof row.skills === 'string' ? row.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean) : row.skills,
      users: normalizedUser,
      user: normalizedUser,
    };
  }

  if (table === 'services') {
    return {
      ...row,
      creator_id: idString(row.creator_id),
      category: row.category || row.label,
      label: row.label || row.category,
      price: row.price == null ? row.price : String(row.price),
    };
  }

  if (table === 'orders') {
    return {
      ...row,
      client_id: idString(row.client_id),
      creator_id: idString(row.creator_id),
      last_updated_by: idString(row.last_updated_by),
      deleted_by_creator: idString(row.deleted_by_creator),
      deleted_by_client: idString(row.deleted_by_client),
      deleted_by: idString(row.deleted_by),
      price: row.price == null ? row.price : String(row.price),
      updated_at: row.updated_at || row.created_at,
    };
  }

  if (table === 'messages') {
    return {
      ...row,
      sender_id: idString(row.sender_id),
      receiver_id: idString(row.receiver_id),
      created_at: row.created_at || row.timestamp,
      timestamp: row.timestamp || row.created_at,
      media_url: row.media_url || null,
      is_deleted: !!row.is_deleted,
      from_smart_match: !!row.from_smart_match,
      service_data: row.service_data || null,
    };
  }

  if (table === 'reviews') {
    return {
      ...row,
      reviewer_id: idString(row.reviewer_id),
      reviewee_id: idString(row.reviewee_id),
      review_text: row.review_text || row.comment,
      comment: row.comment || row.review_text,
    };
  }

  if (table === 'follows') {
    return {
      ...row,
      follower_id: idString(row.follower_id),
      following_id: idString(row.following_id),
    };
  }

  if (table === 'blocks') {
    return {
      ...row,
      blocker_id: idString(row.blocker_id),
      blocked_id: idString(row.blocked_id),
    };
  }

  if (table === 'matches') {
    return {
      ...row,
      client_id: idString(row.client_id),
      creator_id: idString(row.creator_id),
    };
  }

  if (table === 'payment_methods') {
    return {
      ...row,
      user_id: idString(row.user_id),
      type: row.type || row.method_type,
      method_type: row.method_type || row.type,
      account_number: row.account_number || row.masked_number,
      masked_number: row.masked_number || row.account_number,
    };
  }

  if (table === 'user_wallets' || table === 'withdrawals' || table === 'daily_analytics') {
    return {
      ...row,
      user_id: idString(row.user_id),
      creator_id: idString(row.creator_id),
    };
  }

  return row;
};

const normalizeRows = (table: string, rows: Record<string, any>[]) =>
  rows.map((row) => normalizeRow(table, row));

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

const sameValue = (actual: any, expected: any) => {
  if (actual === expected) return true;
  if (expected === null) return actual == null;
  if (actual == null || expected == null) return false;
  return String(actual) === String(expected);
};

const compare = (actual: any, operator: string, expected: any) => {
  if (operator === 'eq' || operator === 'is') {
    return sameValue(actual, expected);
  }
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
    return Array.isArray(expected) ? expected.some((value) => sameValue(actual, value)) : false;
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

class ApiQueryBuilder implements PromiseLike<any> {
  private table: string;
  private filters: { column: string; operator: string; value: any }[] = [];
  private clientFilters: ((row: Record<string, any>) => boolean)[] = [];
  private orderByConfig: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectOptions: { count?: string; head?: boolean } = {};
  private insertPayload: Record<string, any>[] = [];
  private updatePayload: Record<string, any> = {};
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private useApi: boolean;

  constructor(table: string) {
    this.table = table;
    this.useApi = !!TABLE_FETCH_MAP[table];
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
    this.filters.push({ column, operator: 'eq', value });
    this.clientFilters.push((row) => sameValue(row[column], value));
    return this;
  }

  in(column: string, values: any[]) {
    this.clientFilters.push((row) => values.some((value) => sameValue(row[column], value)));
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') {
      const list = parseInList(value);
      this.clientFilters.push((row) => !list.some((item) => sameValue(row[column], item)));
      return this;
    }

    if (operator === 'is') {
      this.clientFilters.push((row) => !sameValue(row[column], value));
      return this;
    }

    this.clientFilters.push(() => true);
    return this;
  }

  is(column: string, value: any) {
    this.clientFilters.push((row) => sameValue(row[column], value));
    return this;
  }

  gt(column: string, value: any) {
    this.clientFilters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.clientFilters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.clientFilters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.clientFilters.push((row) => row[column] <= value);
    return this;
  }

  ilike(column: string, value: string) {
    const pattern = value.toLowerCase().replace(/%/g, '');
    this.clientFilters.push((row) => String(row[column] || '').toLowerCase().includes(pattern));
    return this;
  }

  or(expression: string) {
    const conditions = splitTopLevel(expression).map(buildCondition);
    this.clientFilters.push((row) => conditions.some((condition) => condition(row)));
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderByConfig = { column, ascending };
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

  private buildApiParams(): Record<string, any> {
    const params: Record<string, any> = {};
    // Convert simple eq filters to query params (backend supports these)
    for (const f of this.filters) {
      if (f.operator === 'eq') {
        params[f.column] = f.value;
      }
    }
    return params;
  }

  private async executeViaApi(): Promise<QueryResult> {
    try {
      if (this.mode === 'select') {
        const params = this.buildApiParams();
        const fetchFn = TABLE_FETCH_MAP[this.table];
        if (!fetchFn) throw new Error(`No API endpoint for table: ${this.table}`);

        const data = await fetchFn(params);
        let rows: Record<string, any>[] = normalizeRows(this.table, data?.results || data || []);

        // Apply client-side filters that the API doesn't support
        rows = rows.filter((row) => this.clientFilters.every((filter) => filter(row)));

        // Enrich rows for compatibility
        rows = enrichRows(this.table, rows);

        if (this.orderByConfig) {
          const { column, ascending } = this.orderByConfig;
          rows.sort((a, b) => {
            if (a[column] === b[column]) return 0;
            if (a[column] == null) return 1;
            if (b[column] == null) return -1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return ascending ? -1 : 1;
          });
        }

        const count = this.selectOptions.count === 'exact' ? rows.length : null;

        if (this.selectOptions.head) {
          return { data: null, error: null, count };
        }

        if (this.limitValue != null) {
          rows = rows.slice(0, this.limitValue);
        }

        if (this.singleMode) {
          return { data: rows[0] || null, error: null, count };
        }

        return { data: rows, error: null, count };
      }

      if (this.mode === 'insert') {
        const createFn = TABLE_CREATE_MAP[this.table];
        if (!createFn) return this.executeLocalInsert();

        const inserted = [];
        for (const row of this.insertPayload) {
          const result = await createFn(row);
          inserted.push(normalizeRow(this.table, result));
        }

        if (this.singleMode) {
          return { data: inserted[0] || null, error: null, count: null };
        }
        return { data: inserted, error: null, count: null };
      }

      if (this.mode === 'update') {
        if (this.table === 'services' && this.updatePayload.is_deleted === true) {
          const deleteFn = TABLE_DELETE_MAP[this.table];
          if (deleteFn) {
            const targetIds = await this.getTargetIdsViaApi();
            for (const id of targetIds) {
              await deleteFn(id);
            }
            const deletedRows = targetIds.map((id) => ({ id, ...this.updatePayload }));
            if (this.singleMode) {
              return { data: deletedRows[0] || null, error: null, count: deletedRows.length };
            }
            return { data: deletedRows, error: null, count: deletedRows.length };
          }
        }

        const updateFn = TABLE_UPDATE_MAP[this.table];
        if (!updateFn) return this.executeLocalUpdate();

        const targetIds = await this.getTargetIdsViaApi();
        const updated = [];
        for (const id of targetIds) {
          updated.push(normalizeRow(this.table, await updateFn(id, this.updatePayload)));
        }

        if (this.singleMode) {
          return { data: updated[0] || null, error: null, count: updated.length };
        }
        return { data: updated, error: null, count: updated.length };
      }

      if (this.mode === 'delete') {
        const deleteFn = TABLE_DELETE_MAP[this.table];
        if (!deleteFn) return this.executeLocalDelete();

        const targetIds = await this.getTargetIdsViaApi();
        for (const id of targetIds) {
          await deleteFn(id);
        }
        return { data: null, error: null, count: targetIds.length };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn(`API call failed for ${this.table}, falling back to local:`, err.message);
      return this.executeLocal();
    }
  }

  // ── Local fallback methods (unchanged from original) ──

  private async getTargetIdsViaApi(): Promise<(string | number)[]> {
    const fetchFn = TABLE_FETCH_MAP[this.table];
    if (!fetchFn) return [];
    const data = await fetchFn(this.buildApiParams());
    const rows = normalizeRows(this.table, data?.results || data || [])
      .filter((row) => this.clientFilters.every((filter) => filter(row)));
    return rows.map((row) => row.id).filter((id) => id != null);
  }

  private getFilteredRows(): Record<string, any>[] {
    const baseRows: Record<string, any>[] = enrichRows(this.table, normalizeRows(this.table, getTable(this.table) as Record<string, any>[])).map((row) => deepClone(row));
    let rows: Record<string, any>[] = baseRows.filter((row) => this.clientFilters.every((filter) => filter(row)));

    if (this.orderByConfig) {
      const { column, ascending } = this.orderByConfig;
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

  private async executeLocalSelect(): Promise<QueryResult> {
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

  private async executeLocalInsert(): Promise<QueryResult> {
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

  private async executeLocalUpdate(): Promise<QueryResult> {
    const table = getTable(this.table);
    const updated: Record<string, any>[] = [];

    table.forEach((row, index) => {
      if (this.clientFilters.every((filter) => filter(row))) {
        table[index] = { ...row, ...this.updatePayload, updated_at: new Date().toISOString() };
        updated.push(deepClone(table[index]));
      }
    });

    if (this.singleMode) {
      return { data: updated[0] || null, error: null, count: updated.length };
    }

    return { data: updated, error: null, count: updated.length };
  }

  private async executeLocalDelete(): Promise<QueryResult> {
    const table = getTable(this.table);
    const deleted: Record<string, any>[] = [];

    for (let index = table.length - 1; index >= 0; index -= 1) {
      if (this.clientFilters.every((filter) => filter(table[index]))) {
        deleted.push(deepClone(table[index]));
        table.splice(index, 1);
      }
    }

    if (this.singleMode) {
      return { data: deleted[0] || null, error: null, count: deleted.length };
    }

    return { data: deleted.reverse(), error: null, count: deleted.length };
  }

  private executeLocal() {
    if (this.mode === 'insert') return this.executeLocalInsert();
    if (this.mode === 'update') return this.executeLocalUpdate();
    if (this.mode === 'delete') return this.executeLocalDelete();
    return this.executeLocalSelect();
  }

  private execute() {
    // Try API first, fall back to local
    if (this.useApi) {
      return this.executeViaApi();
    }
    return this.executeLocal();
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
    return new ApiQueryBuilder(table);
  },
  rpc(name: string, params: Record<string, any> = {}) {
    if (name === 'get_creator_dashboard_stats') {
      // Try API for analytics, fall back to local
      const creatorId = params.target_user_id;
      return api.fetchDailyAnalytics({ creator_id: creatorId })
        .then((data) => {
          const rows = data?.results || data || [];
          const totals = rows.reduce((acc: any, r: any) => ({
            total_views: acc.total_views + (r.profile_views || 0),
            total_clicks: acc.total_clicks + (r.service_clicks || 0),
            today_views: r.profile_views || 0,
            today_clicks: r.service_clicks || 0,
          }), { total_views: 0, total_clicks: 0, today_views: 0, today_clicks: 0 });

          return api.fetchOrders({ creator_id: creatorId }).then((orderData) => {
            const orders = orderData?.results || orderData || [];
            const activeProjects = orders.filter((o: any) => ['pending', 'accepted', 'in_progress', 'delivered', 'active'].includes(o.status)).length;
            const completedOrders = orders.filter((o: any) => o.status === 'completed');
            const lastMonthEarnings = completedOrders.reduce((total: number, o: any) => total + (parseFloat(String(o.price || 0)) || 0), 0);

            return {
              data: [{
                ...totals,
                active_projects: activeProjects,
                last_month_earnings: lastMonthEarnings,
              }],
              error: null,
            };
          });
        })
        .catch(() => {
          // Fallback to local
          const orders = getTable('orders').filter((order) => order.creator_id === creatorId);
          const activeProjects = orders.filter((order) => ['pending', 'accepted', 'in_progress', 'delivered', 'active'].includes(order.status)).length;
          const completedOrders = orders.filter((order) => order.status === 'completed');
          const lastMonthEarnings = completedOrders.reduce((total, order) => total + (parseFloat(String(order.price || 0)) || 0), 0);
          return {
            data: [{
              total_views: 128,
              total_clicks: 41,
              today_views: 9,
              today_clicks: 4,
              active_projects: activeProjects,
              last_month_earnings: lastMonthEarnings,
            }],
            error: null,
          };
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

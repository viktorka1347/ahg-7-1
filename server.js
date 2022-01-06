const tickets = [];

const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');

const fullToShort = () => JSON.stringify(
  tickets.map(({
    id, name, status, created,
  }) => ({
    id,
    name,
    status,
    created,
  })),
);

const app = new Koa();

app.use(
  koaBody({
    urlencoded: true,
  }),
);

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');

  if (!origin) {
    return next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        ctx.request.get('Access-Control-Allow-Request-Headers'),
      );
    }
    ctx.response.status = 204;
  }

  return null;
});

app.use(async (ctx, next) => {
  if (ctx.request.method !== 'GET') {
    return next();
  }

  const { method, id: reqId } = ctx.request.query;

  let ticket;

  switch (method) {
    case 'allTickets':
      ctx.response.body = fullToShort();
      return null;

    case 'ticketById':
      ticket = tickets.find(({ id }) => id === +reqId);

      if (!ticket) {
        ctx.response.status = 404;
        return null;
      }

      ctx.response.body = ticket.description;
      return null;

    default:
      ctx.response.status = 400;
      return null;
  }
});

app.use(async (ctx, next) => {
  if (ctx.request.method !== 'POST') {
    return next();
  }

  const {
    method,
    id: reqId,
    name: reqName,
    description: reqDescription,
    status: reqStatus,
  } = ctx.request.body;

  let ticket;
  let index;

  switch (method) {
    case 'createTicket':
      if (!reqId) {
        tickets.push({
          id: tickets.length ? tickets[tickets.length - 1].id + 1 : 1,
          name: reqName,
          description: reqDescription,
          status: reqStatus,
          created: Date.now(),
        });

        ctx.response.body = fullToShort();
        return null;
      }

      ticket = tickets.find(({ id }) => id === +reqId);

      if (!ticket) {
        ctx.response.status = 404;
        return null;
      }

      ticket.name = reqName;
      ticket.description = reqDescription;
      ticket.status = reqStatus;
      ctx.response.body = fullToShort();
      return null;

    case 'deleteTicket':
      index = tickets.findIndex(({ id }) => id === +reqId);

      if (index < 0) {
        ctx.response.status = 404;
        return null;
      }

      tickets.splice(index, 1);
      ctx.response.body = fullToShort();
      return null;

    default:
      ctx.response.status = 400;
      return null;
  }
});

app.use(async (ctx) => {
  ctx.response.status = 405;
});

const port = process.env.PORT || 7070;
http.createServer(app.callback()).listen(port);

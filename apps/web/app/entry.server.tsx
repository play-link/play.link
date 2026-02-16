import {renderToReadableStream} from 'react-dom/server';
import type {EntryContext} from 'react-router';
import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {ServerStyleSheet, StyleSheetManager} from 'styled-components';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const sheet = new ServerStyleSheet();

  try {
    const body = await renderToReadableStream(
      <StyleSheetManager sheet={sheet.instance}>
        <ServerRouter context={routerContext} url={request.url} />
      </StyleSheetManager>,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error(error);
          responseStatusCode = 500;
        },
      },
    );

    if (isbot(request.headers.get('user-agent') || '')) {
      await body.allReady;
    }

    // Wait for stream to finish so styled-components can collect all styles
    await body.allReady;
    const html = await new Response(body).text();
    const styleTags = sheet.getStyleTags();
    const finalHtml = html.replace('</head>', `${styleTags}</head>`);

    responseHeaders.set('Content-Type', 'text/html');

    return new Response(finalHtml, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', {
      headers: responseHeaders,
      status: 500,
    });
  } finally {
    sheet.seal();
  }
}

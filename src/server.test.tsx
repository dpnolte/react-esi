import express from "express";
import React from "react";
import request from "supertest";

process.env.REACT_ESI_SECRET = "dummy";
process.env.REACT_ESI_PATH = "/_custom";
import { createIncludeElement, path, serveFragment } from "./server";

test("path", () => {
  expect(path).toBe("/_custom");
});

test("createIncludeElement", () => {
  const elem = createIncludeElement(
    "fragmentID",
    { name: "Kévin" },
    { attrs: { alt: `"'<&Alt>'"` } }
  );
  expect(elem).toMatchSnapshot();
});

const fragmentURL =
  "/_custom?fragment=fragmentID&props=%7B%22name%22%3A%22K%C3%A9vin%22%7D&sign=f7ddf06659aadbcba0cdad4c927ac5bf38167d714e1a15cad13115e7e9d21a9d";
test("serveFragment", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    return (p: { name: string }) => <div>Hello {p.name}</div>;
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  expect(response.text).toMatchSnapshot();
});

test("serveFragment complex", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    return (p: { name: string }) => {
      return (
        <div className="css-a5qmhs e1e5uckb0">
          <div className="css-910pwr e1e5uckb1">
            <img
              src="/static/media/yoda.e216d82d.svg"
              className="css-r62z6h e1e5uckb2"
            />
            <h2>Page 3</h2>
          </div>
          <p className="css-iqjf8m e1e5uckb3">
            To get started, edit
            <code>src/apps/Page3/App.tsx</code>
            and save to reload.
          </p>
          <ul className="css-o9b79t e1e5uckb4">
            <li className="css-bkrwwc e1e5uckb5">
              <a href="/">Go back home</a>
            </li>
          </ul>
        </div>
      );
    };
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  expect(response.text).toMatchSnapshot();
});

test("initial props", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    interface IPropsType {
      name: string;
    }
    const Component = (p: IPropsType) => <div>Hello {p.name}</div>;
    Component.getInitialProps = async () => {
      return { name: "Anne" };
    };

    return Component;
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  expect(response.text).toMatchSnapshot();
});

test("invalid signature", async () => {
  const app = express();
  const resolver = () => () => <div />;

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(
      "/_custom?fragment=fragmentID&props=%7B%22foo%22%3A%22bar%22%7D&sign=invalid"
    )
    .expect(400);
  expect(response.text).toMatchSnapshot();
});

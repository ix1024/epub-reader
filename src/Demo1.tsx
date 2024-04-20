/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction, useEffect, useRef, useState } from "react";
// import { ResizableBox } from "react-resizable";
import { Resizable } from "re-resizable";

import css from "./demo1.module.less";
import { Input } from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import MonacoEditor from "react-monaco-editor";

function App() {
  const [src, setSrc] = useState<string>(
    "https://es6.ruanyifeng.com/#docs/promise"
  );
  const refJs = useRef(null);
  // 刷新
  const [refresh, setRefresh] = useState<number>();
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("afasdf");
  const [cssContent, setCssContent] = useState<string>("");
  const [jsContent, setJsContent] = useState<string>("");
  // const ref = useRef<HTMLInputElement | null>(null);
  // const boxRef = useRef<HTMLInputElement | null>(null);
  // 只执行一次

  useEffect(() => {
    setSrcDoc(
      `
      <html>
        <head>
          <style>
            ${cssContent}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            ${jsContent}
          </script>
        </body>
      </html>
    `
    );
  }, [htmlContent, cssContent, jsContent]);
  useEffect(() => {
    // run();
    // 修改console Proxy
    // const oldConsole = window.console;
  }, []);
  // useEffect(() => {
  //   const { current } = refJs;
  //   let myView = new EditorView({
  //     doc: htmlContent,
  //     extensions: [keymap.of(defaultKeymap)],
  //     parent: current,
  //   });
  //   console.log(myView);
  // }, [htmlContent]);
  // useEffect(() => {
  //   const { current } = ref;
  //   const { current: box } = boxRef;
  //   if (!current || !box) return;
  //   const canvas = document.createElement("canvas");
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;
  // }, []);
  const theme = "vs-dark";
  return (
    <>
      {/* <ResizableBox
        width={"200"}
        // height={200}
        // axis="x"
        style={{
          border: "1px solid #f00",
        }}
        draggableOpts={{}}
        // minConstraints={[100, 100]}
        // maxConstraints={[300, 300]}
      >
        <span>Contents</span>
      </ResizableBox> */}
      <div className={css.wrap1}>
        <Resizable
          className={css.left}
          defaultSize={{
            width: "50%",
            height: "100%",
          }}
          enable={{
            right: true,
          }}
        >
          <div ref={refJs}>
            <MonacoEditor
              language="html"
              theme={theme}
              value={htmlContent}
              // options={{
              //   selectOnLineNumbers: true,
              //   roundedSelection: false,
              //   readOnly: false,
              //   cursorStyle: "line",
              //   automaticLayout: false,
              //   minimap: {
              //     enabled: false,
              //   },
              //   lineNumbersMinChars: 3,
              //   fontSize: 16,
              //   scrollBeyondLastLine: false,
              //   wordWrap: "on",
              // }}
              onChange={(newValue: SetStateAction<string>) => {
                console.log("onChange", newValue);
                setHtmlContent(newValue);
              }}
              editorDidMount={(editor: any) =>
                console.log("editorDidMount", editor)
              }
            />
          </div>
          <div>
            <MonacoEditor
              language="css"
              theme={theme}
              value={cssContent}
              onChange={(newValue: SetStateAction<string>) => {
                setCssContent(newValue);
              }}
            />
          </div>
          <div>
            <MonacoEditor
              language="javascript"
              theme={theme}
              value={jsContent}
              onChange={(newValue: SetStateAction<string>) => {
                setJsContent(newValue);
              }}
            />
          </div>
        </Resizable>

        <div className={css.right}>
          <div>
            <div className={css.browser}>
              <div className={css.header}>
                <div className={css.icon}>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <div>
                  <div>
                    <ReloadOutlined
                      onClick={() => {
                        setRefresh(Date.now());
                      }}
                    />
                  </div>
                  <div>
                    <HomeOutlined size={12} />
                  </div>
                </div>
                <div>
                  <Input size="small" />
                </div>
                <div></div>
              </div>
              <div className={css.main}>
                <iframe
                  srcDoc={srcDoc}
                  src={src}
                  title="demo"
                  key={refresh}
                ></iframe>
              </div>
            </div>
          </div>
          <div>3</div>
        </div>
      </div>
      {/* <div className={css.color}>Ship for any target.</div> */}
      {/* <input type="file" ref={ref} /> */}
    </>
  );
}

export default App;

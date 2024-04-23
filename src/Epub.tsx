/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { Rendition } from "epubjs";
import CryptoJS from "crypto-js";
import {
  BookOutlined,
  EyeOutlined,
  FileOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import css from "./Epub.module.less";
import {
  Button,
  Col,
  ConfigProvider,
  Dropdown,
  Empty,
  Menu,
  Row,
  Slider,
  Spin,
  Tooltip,
} from "antd";

import bookImg from "./img/book.svg";
const gutter: [number, number] = [16, 16];
declare const window: any;

// 设置全屏或退出全屏
const setFullScreen = (isFullScreen: boolean) => {
  if (isFullScreen) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

type MenuItem = {
  key: string;
  label: any;
  value: any;
  children?: MenuItem[];
}; // Required<MenuProps>["items"][number];

export type OldMenu = {
  href: string;
  id: string;
  label: any;
  parent: string;
  subitems: OldMenu[];
};

export type Options = {
  label: any;
  value: any;
  children?: Options[];
};

// eslint-disable-next-line react-refresh/only-export-components
export const getOptions = (menus: OldMenu[]): Options[] => {
  return menus?.map((item: OldMenu) => {
    const { label, href, subitems } = item;
    return {
      label,
      value: href,
      children: subitems ? getOptions(subitems) : undefined,
    };
  });
};

// 根据key 拿到对应的value
const getValue = (key: string, menus: MenuItem[]): any => {
  for (let i = 0; i < menus.length; i++) {
    const item = menus[i];
    if (item.key === key) {
      return item.value;
    }
    if (item.children) {
      const value = getValue(key, item.children);
      if (value) {
        return value;
      }
    }
  }
  return null;
};
async function getFilesInDirectory(directoryHandle: any) {
  const entries = await directoryHandle.values();
  const files = [];
  //过滤掉不是.epub的文件
  for await (const entry of entries) {
    if (entry.kind === "directory") {
      // 如果是目录，则递归获取目录下的文件，并将结果作为子项添加到当前目录
      const children: any = await getFilesInDirectory(entry);
      if (children?.length) {
        files.push({
          key: entry.name,
          label: entry.name,
          value: entry,
          children,
          icon: <FolderOpenOutlined />,
        });
      }
    } else {
      // 如果是文件，则将其添加到当前目录的文件列表中
      const file = await entry.getFile();

      const isEpub = file.type === "application/epub+zip";
      if (isEpub) {
        files.push({
          key: entry.name,
          label: entry.name,
          value: file,
          icon: <FileOutlined />,
        });
      }
    }
  }

  return files;
}

async function getAllFilesInDirectory(directoryHandle: any) {
  const files = await getFilesInDirectory(directoryHandle);
  return files;
}
// thems
const themesList = [
  {
    label: "default",
    value: "#ffffff",
    color: "inherit",
  },

  {
    label: "theme1",
    value: "#f5efda",
    color: "#333",
  },

  {
    label: "theme2",
    value: "#c0edc6",
    color: "#333",
  },

  {
    label: "theme3",
    value: "#000000",
    color: "#fff",
  },
  {
    label: "theme4",
    value: "#f8f8fa",
    color: "#333",
  },
];

export class MyStore {
  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  get(key: string) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
}
const store = new MyStore();

const Epub = () => {
  //全屏
  const [isFullScreen, setIsFullScreen] = useState(false);
  const progressRef = useRef<any>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewLoading, setViewLoading] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [spread, setSpread] = useState<string>("auto");
  const [currrent, setCurrent] = useState<number>();
  const [total, setTotal] = useState<number>();
  const [ready, setReady] = useState<boolean>(false);
  const [progressReady, setProgressReady] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<"small" | "default" | "large">(
    "default"
  );
  //   const { width = 800, height = 500 } = useWindow();
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(500);
  const menuRef = useRef<HTMLInputElement | null>(null);
  const refArea = useRef<HTMLInputElement | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<any>(null);
  const rContentRef = useRef<HTMLInputElement | null>(null);
  //  文件目录
  const [list, setList] = useState<MenuItem[]>([]);
  // 书签
  const [bookmarks, setBookmarks] = useState<Options[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [title, setTitle] = useState<string>("");
  const viewFile = async (file: any) => {
    const { current: refAreaContent } = refArea as any;
    await bookRef?.current?.destroy();
    let md5: any;
    setBookmarks([]);
    setProgressReady(false);
    setProgress(0);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const book = ePub(e.target.result);
      const wordArray = CryptoJS.lib.WordArray.create(reader.result);
      md5 = CryptoJS.MD5(wordArray).toString();
      console.log("MD5:", md5);

      bookRef.current = book;
      book.renderTo(refAreaContent, {
        width,
        height,
        snap: true,
        // flow: "paginated",
      });

      await book?.rendition?.display();
      setTitle(file.name);

      const res = await bookRef.current.loaded.pageList;
      console.log(res);
      bookRef.current.loaded.navigation.then(() => {
        // 获取书籍目录
        const toc: OldMenu[] = bookRef.current.navigation.toc || [];
        setBookmarks(getOptions(toc));

        renditionRef.current = new Rendition(bookRef.current, {});
        window.rendition = renditionRef.current;

        [
          //   "started",
          //   "attached",
          //   "displayed",
          //   "displayError",
          //   "rendered",
          //   "removed",
          //   "orientationchange",
          //   "locationChanged",
          "relocated",
          "progress",
          //   "markClicked",
          //   "selected",
          //   "resized",
        ].forEach((item) => {
          book.rendition.on(item, (location: any) => {
            console.log(item, location);
          });
        });

        const thems = book.rendition.themes;
        thems.register("/public/thems.css" as any);

        window.thems = thems;
        //

        setLoading(false);
      });

      window.book = bookRef.current;
      await bookRef?.current?.ready;
      getCurrent();
      setReady(true);
      if (store.get(md5)) {
        bookRef.current.locations.load(store.get(md5));
        setProgressReady(true);
        console.log("load");
      }
      console.time("generate");
      const result = await book?.locations?.generate(200);
      store.set(md5, result);
      console.timeEnd("generate");
      console.log(result?.length);
      setProgressReady(true);
    };
    reader.readAsArrayBuffer(file);
  };
  const openFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".epub";
    input.onchange = async (e: any) => {
      viewFile(e.target.files[0]);
    };
    input.click();
  };
  const getCurrent = async () => {
    if (
      !bookRef?.current?.rendition?.currentLocation() ||
      !bookRef?.current?.rendition?.currentLocation().start ||
      !bookRef?.current?.rendition?.currentLocation().end
    ) {
      return;
    }

    const { start } = await bookRef!.current!.rendition!.currentLocation();
    const { index } = start || {};
    const total = bookRef?.current?.locations?.spine?.length;
    setCurrent(index + 1);
    setTotal(total);
  };
  const setBookFontSize = (size: string | undefined) => {
    bookRef?.current?.rendition?.themes?.fontSize(size);
  };

  useEffect(() => {
    setBookFontSize(
      {
        small: "80%",
        default: "100%",
        large: "120%",
      }[fontSize]
    );
  }, [fontSize]);
  useEffect(() => {
    const reset = (data: Options[]): MenuItem[] => {
      return data?.map((item) => {
        const { label, value, children } = item;
        return {
          key: `${label}-${value}`,
          label: <span data-value={value}>{label}</span>,
          value,
          children: children?.length ? reset(children) : undefined,
        };
      });
    };
    setItems(reset(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    bookRef?.current?.rendition?.spread(spread);
  }, [spread]);

  useEffect(() => {
    if (
      bookRef &&
      bookRef.current &&
      bookRef!.current?.rendition &&
      bookRef!.current?.rendition.resize
    ) {
      bookRef!.current?.rendition.resize(width, height);
    }
  }, [width, height]);
  const goNext = async () => {
    await bookRef?.current?.rendition?.next();
    getCurrent();
  };
  const goPrev = async () => {
    await bookRef?.current?.rendition?.prev();
    getCurrent();
  };
  const calcResize = useCallback(() => {
    const { current: rContent } = menuRef;
    const { current } = rContentRef;

    if (!rContent) {
      return;
    }

    const { clientWidth } = rContent;
    setWidth(window.innerWidth - clientWidth);
    setHeight(current!.clientHeight - 35);
    getCurrent();
  }, [menuRef, rContentRef]);
  useEffect(() => {
    calcResize();
    //监听全屏
    const fullScreenChange = () => {
      setIsFullScreen(document.fullscreenElement ? true : false);
    };

    // 绑定方向键事件
    const keydown = async (e: KeyboardEvent) => {
      try {
        // 右方向键
        if (e.keyCode === 39) {
          await goNext();
        }
        // 左方向键
        if (e.keyCode === 37) {
          await goPrev();
        }
      } catch (error) {
        console.log("keydown error", error);
      }
      getCurrent();
    };
    window.addEventListener("resize", calcResize);
    window.addEventListener("keydown", keydown);
    window.addEventListener("fullscreenchange", fullScreenChange);
    return () => {
      bookRef?.current?.destroy();
      window.removeEventListener("resize", calcResize);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("fullscreenchange", fullScreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      calcResize();
    }, 100);
  }, [calcResize, isFullScreen, collapsed]);

  const addAll = async () => {
    try {
      // 请求用户选择目录
      const directoryHandle = await window.showDirectoryPicker();
      // 获取目录下所有文件
      const files = await getAllFilesInDirectory(directoryHandle);
      setList(files);
    } catch (err) {
      console.error("获取目录下文件时出错:", err);
    }
  };

  return (
    <>
      <div className={css.bookWrap}>
        <div
          className={css.bookHeader}
          style={{
            display: isFullScreen ? "none" : "",
          }}
        >
          <div>
            <div className={css.logo} onClick={addAll}>
              <Tooltip
                title={window.showDirectoryPicker ? "打开目录" : undefined}
              >
                <>
                  <Dropdown
                    disabled={!window.showDirectoryPicker}
                    dropdownRender={() => {
                      return (
                        <div
                          style={{
                            minWidth: 300,
                            maxWidth: 500,
                            maxHeight: window.innerHeight - 200,
                            overflow: "auto",
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                          }}
                        >
                          {list?.length ? (
                            <Spin spinning={loading}>
                              <Menu
                                style={{
                                  width: "100%",
                                }}
                                inlineCollapsed={collapsed}
                                mode="inline"
                                items={list}
                                onClick={(item) => {
                                  viewFile(getValue(item.key, list));
                                }}
                              />
                            </Spin>
                          ) : null}
                        </div>
                      );
                    }}
                  >
                    <img
                      src={bookImg}
                      alt=""
                      style={{ width: 30, height: 30 }}
                    />
                  </Dropdown>
                </>
              </Tooltip>
            </div>
            <div className={css.title} title={title}>
              {title}
            </div>
          </div>
          <div>
            <Row justify="center" align="middle">
              {/* <Col>
                <Button
                  data-noborder
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => {
                    setCollapsed(!collapsed);
                  }}
                >
                  {collapsed ? "展开" : "收起"}
                </Button>
              </Col> */}
              <Col>
                <Dropdown
                  disabled={!items?.length || !ready}
                  dropdownRender={() => (
                    <>
                      <Spin spinning={viewLoading}>
                        <Menu
                          items={items}
                          onClick={async (arg: any) => {
                            const { domEvent } = arg;
                            const { target } = domEvent;
                            const { dataset } = target;
                            const { value } = dataset;
                            setViewLoading(true);
                            try {
                              await bookRef?.current?.rendition?.display(value);
                              setViewLoading(false);
                            } catch (error) {
                              const list = value?.split("/");
                              list.shift();
                              await bookRef?.current?.rendition?.display(
                                list?.join("/")
                              );
                              setViewLoading(false);
                            }
                          }}
                        />
                      </Spin>
                    </>
                  )}
                >
                  <Button
                    icon={<BookOutlined />}
                    data-noborder
                    onClick={() => {
                      setCollapsed(!collapsed);
                    }}
                  >
                    目录
                  </Button>
                </Dropdown>
              </Col>
              <Col>
                <Row justify="center" align="middle">
                  <Col>
                    <Button
                      disabled={!ready}
                      data-noborder
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSpread(spread === "none" ? "auto" : "none");
                      }}
                    >
                      {spread === "none" ? "单页" : "双页"}
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      disabled={!ready}
                      data-noborder
                      icon={
                        isFullScreen ? (
                          <FullscreenExitOutlined />
                        ) : (
                          <FullscreenOutlined />
                        )
                      }
                      onClick={() => {
                        setFullScreen(!isFullScreen);
                      }}
                    >
                      {isFullScreen ? "退出全屏" : "全屏"}
                    </Button>
                  </Col>
                  {/* <Col></Col> */}
                  <Col>
                    <Row align="middle" justify="center" gutter={gutter}>
                      <Col>
                        <Button
                          data-noborder
                          size="small"
                          disabled={!ready}
                          icon={<LeftOutlined />}
                          onClick={goPrev}
                        ></Button>
                      </Col>

                      {/* <Col>{currrent}</Col> */}
                      {/* <Col>/</Col> */}
                      {/* <Col>
                  <InputNumber
                    size="small"
                    disabled={!ready}
                    min={1}
                    max={total}
                  />
                </Col> */}
                      {/* <Col>{total}</Col> */}
                      <Col>
                        <Button
                          data-noborder
                          size="small"
                          disabled={!ready}
                          icon={<RightOutlined />}
                          onClick={goNext}
                        ></Button>
                      </Col>
                    </Row>
                  </Col>
                  <Col>
                    <Dropdown
                      placement="bottom"
                      //   disabled={!ready}
                      dropdownRender={() => {
                        return (
                          <div className={css.dropdownContent} style={{}}>
                            <Row gutter={gutter} align="middle">
                              <Col span={24}>
                                <Row gutter={gutter} align="middle">
                                  <Col span={6}>字体大小</Col>
                                  <Col>
                                    <Button
                                      icon={<FontSizeOutlined />}
                                      data-noborder
                                      size="small"
                                      onClick={() => {
                                        setFontSize("small");
                                      }}
                                    >
                                      小
                                    </Button>
                                  </Col>
                                  <Col>
                                    <Button
                                      icon={<FontSizeOutlined />}
                                      data-noborder
                                      size="small"
                                      onClick={() => {
                                        setFontSize("default");
                                      }}
                                    >
                                      正常
                                    </Button>
                                  </Col>
                                  <Col>
                                    <Button
                                      icon={<FontSizeOutlined />}
                                      data-noborder
                                      size="small"
                                      onClick={() => {
                                        setFontSize(`large`);
                                      }}
                                    >
                                      大
                                    </Button>
                                  </Col>
                                </Row>
                              </Col>
                              <Col span={24}>
                                <Row gutter={gutter} align="middle">
                                  <Col span={7}>主题</Col>
                                  {themesList?.map((item) => {
                                    const { label, value, color } = item;
                                    return (
                                      <Col key={label}>
                                        <div
                                          style={{
                                            float: "left",
                                            width: 20,
                                            height: 20,
                                            cursor: "pointer",
                                            display: "inline-block",
                                            borderRadius: "50%",
                                            border: `1px solid #e5e5e5`,
                                            backgroundColor: value,
                                          }}
                                          onClick={() => {
                                            bookRef?.current?.rendition?.themes?.select(
                                              label
                                            );
                                            document.documentElement.style.setProperty(
                                              "--background-color",
                                              value
                                            );
                                            document.documentElement.style.setProperty(
                                              "--text-color",
                                              color
                                            );
                                          }}
                                        ></div>
                                      </Col>
                                    );
                                  })}
                                </Row>
                              </Col>
                            </Row>
                          </div>
                        );
                      }}
                    >
                      <Button
                        disabled={!ready}
                        data-noborder
                        icon={<SettingOutlined />}
                        //   icon={}
                        size="small"
                      >
                        设置
                      </Button>
                    </Dropdown>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
          <div>
            <Row justify="end" align="middle">
              <Col>
                <Button
                  data-noborder
                  disabled={loading}
                  size="small"
                  //   type="primary"
                  icon={<PlusOutlined />}
                  onClick={openFile}
                >
                  打开
                </Button>
              </Col>
            </Row>
          </div>
        </div>
        <div className={css.bookBody}>
          <div
            ref={menuRef}
            className={css.menu}
            style={{
              display: collapsed ? "none" : "",
            }}
          >
            <Spin spinning={viewLoading}>
              <Menu
                items={items}
                onClick={async (arg: any) => {
                  const { domEvent } = arg;
                  const { target } = domEvent;
                  const { dataset } = target;
                  const { value } = dataset;
                  setViewLoading(true);
                  try {
                    await bookRef?.current?.rendition?.display(value);
                    setViewLoading(false);
                  } catch (error) {
                    const list = value?.split("/");
                    list.shift();
                    await bookRef?.current?.rendition?.display(list?.join("/"));
                    setViewLoading(false);
                  }
                }}
              />
            </Spin>
            {items?.length ? null : (
              <div className={css.placeCenter}>
                <Empty description="暂无数据" />
              </div>
            )}
          </div>
          <div ref={rContentRef} className={css.content}>
            <div className={css.rContent}>
              <div
                className={css.rContentMain}
                ref={refArea}
                style={{
                  width,
                  height,
                  overflow: "hidden",
                  //   backgroundImage: `url(${bookImg})`,
                  //   backgroundRepeat: "no-repeat",
                  //   backgroundPosition: "center",
                }}
              ></div>
              {ready ? (
                ""
              ) : (
                <div
                  onClick={openFile}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    userSelect: "none",
                    cursor: "pointer",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <img
                    src={bookImg}
                    alt=""
                    style={{
                      width: 200,
                      height: 200,
                      opacity: 0.05,
                      filter: "grayscale(100%)",
                    }}
                  />
                </div>
              )}
            </div>

            <div
              className={css.bookFooter}
              style={{
                opacity: progressReady ? 1 : 0,
                // display: isFullScreen ? "none" : "",
              }}
            >
              <Row align="middle" gutter={gutter}>
                <Col flex={1}>
                  <Slider
                    value={progress}
                    disabled={!progressReady}
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      formatter: (value: any) => {
                        return `${Math.round(value * 100)}%`;
                      },
                    }}
                    onChange={async (ev) => {
                      const book = bookRef.current;
                      clearTimeout(progressRef.current);
                      setProgress(ev);
                      progressRef.current = setTimeout(() => {
                        book?.rendition?.display(
                          book?.locations?.cfiFromPercentage(ev)
                        );
                      }, 100);
                    }}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#7262E7",
        },
      }}
    >
      <Epub />
    </ConfigProvider>
  );
};
export default App;

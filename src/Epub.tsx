/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import ePub, { Rendition } from "epubjs";
import {
  FileOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import css from "./Epub.module.less";
import { Button, Empty, Menu, Spin } from "antd";
import { useWindow } from "./useWindow";
import { icons } from "antd/es/image/PreviewGroup";

declare const window: any;

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

const Epub = () => {
  const leftRef = useRef<HTMLInputElement | null>(null);
  const middleRef = useRef<HTMLInputElement | null>(null);
  const rightRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewLoading, setViewLoading] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  //   const { width = 800, height = 500 } = useWindow();
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(500);
  const refArea = useRef<HTMLInputElement | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<any>(null);
  //  文件目录
  const [list, setList] = useState<MenuItem[]>([]);
  // 书签
  const [bookmarks, setBookmarks] = useState<Options[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [title, setTitle] = useState<string>("");
  const viewFile = async (file: any) => {
    const { current: refAreaContent } = refArea;
    await bookRef?.current?.destroy();
    setBookmarks([]);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      bookRef.current = ePub(e.target.result);
      bookRef.current.renderTo(refAreaContent, {
        // method: "default",
        width,
        height,
        //   view: "inline",
        snap: true,
        //   manager: "continuous",
        flow: "paginated",
      });
      // if (!renditionRef.current) {
      //   return;
      // }
      const displayed = bookRef?.current?.rendition?.display();
      console.log(displayed, renditionRef.current, bookRef.current, file, e);
      setTitle(file.name);

      // // 显示指定页码的内容
      // function showPage(pageNumber) {
      //   book.goto(pageNumber).then(() => {
      //     // 清空书籍容器
      //     bookContainer.innerHTML = "";

      //     // 获取当前页的内容
      //     const currentChapter = book.getCurrentChapter();

      //     // 将内容添加到书籍容器中
      //     currentChapter.renderTo(bookContainer);
      //   });
      // }

      // // 翻页按钮点击事件处理函数
      // function nextPage() {
      //   book.nextPage().then(() => {
      //     // 获取当前页码
      //     const pageNumber = book.pagination.pageIndex + 1;
      //     showPage(pageNumber);
      //   });
      // }

      // function prevPage() {
      //   book.prevPage().then(() => {
      //     // 获取当前页码
      //     const pageNumber = book.pagination.pageIndex + 1;
      //     showPage(pageNumber);
      //   });
      // }
      bookRef.current.loaded.navigation.then(() => {
        // 获取书籍目录
        const toc: OldMenu[] = bookRef.current.navigation.toc || [];
        console.log(bookRef.current.navigation.toc);
        setBookmarks(getOptions(toc));

        // 打印目录信息
        //   console.log("EPUB 目录:");
        //   toc.forEach((item, index) => {
        //     console.log(`Chapter ${index + 1}: ${item.label} (${item.href})`);
        //   });
        //   showPage(1);
        renditionRef.current = new Rendition(bookRef.current, {});
        window.rendition = renditionRef.current;
        setLoading(false);
      });

      window.book = bookRef.current;
    };
    reader.readAsArrayBuffer(file);
  };
  const openFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".epub";
    // input.multiple = true;
    input.onchange = async (e: any) => {
      console.clear();

      viewFile(e.target.files[0]);
    };
    input.click();
  };
  //<input type="file" multiple directory />
  //   useEffect(() => {
  //     console.log("items", items);
  //   }, [items]);
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
    const calc = () => {
      const { current: left } = leftRef;
      const { current: middle } = middleRef;
      const { current: right } = rightRef;
      if (!left || !middle || !right) return;
      const { clientWidth: wWidth } = document.documentElement;
      const { clientWidth: lWidth } = left;
      const { clientWidth: mWidth } = middle;
      const width = wWidth - lWidth - mWidth;
      setWidth(width - 20);
      setHeight(600);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => {
      bookRef?.current?.destroy();
      window.removeEventListener("resize", calc);
    };
  }, []);
  useEffect(() => {}, []);
  const addAll = async () => {
    try {
      // 请求用户选择目录
      const directoryHandle = await window.showDirectoryPicker();
      // 获取目录下所有文件
      const files = await getAllFilesInDirectory(directoryHandle);
      console.log(files);
      setList(files);
    } catch (err) {
      console.error("获取目录下文件时出错:", err);
    }
  };
  return (
    <div className={css.wrap}>
      <div
        className={css.left}
        ref={leftRef}
        style={{
          width: collapsed ? undefined : 260,
        }}
      >
        <div>
          <div className={css.open}>
            <Button disabled={loading} type="link" onClick={addAll}>
              <FolderOpenOutlined />
              {collapsed ? null : <>打开目录</>}
            </Button>
          </div>
        </div>
        <div>
          {list?.length ? (
            <Spin spinning={loading}>
              <Menu
                inlineCollapsed={collapsed}
                mode="inline"
                items={list}
                onSelect={(item) => {
                  console.log(item, getValue(item.key, list));
                  viewFile(getValue(item.key, list));
                }}
              />
            </Spin>
          ) : !collapsed ? (
            <div className={css.middleAlign}>
              <Empty description="暂无文件" />
            </div>
          ) : null}
        </div>
        <div>
          <Button
            // type="link"
            style={{
              border: "none",
            }}
            onClick={() => {
              setCollapsed(!collapsed);
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
        </div>
      </div>
      <div className={css.middle} ref={middleRef}>
        <div>
          {title ||
            "原则：应对变化中的世界秩序 (瑞·达利欧 （Ray Dalio）) (Z-Library).epub"}
        </div>
        <div>
          <Spin spinning={viewLoading}>
            <Menu
              items={items}
              onSelect={async (arg: any) => {
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
        </div>
        <div></div>
      </div>
      <div className={css.right} ref={rightRef}>
        <div className={css.rHeader}>
          <div></div>
          <div></div>
          <div>
            <Button
              disabled={loading}
              size="small"
              type="primary"
              icon={<UnorderedListOutlined />}
              onClick={openFile}
            ></Button>
          </div>
        </div>
        <div className={css.rContent}>
          <div
            ref={refArea}
            style={{
              width,
              height,
              overflow: "hidden",
            }}
          ></div>
        </div>
        <div className={css.rFooter}></div>
      </div>
    </div>
  );
};

export default Epub;

import { useEffect, useState } from "react";
import { MinimalExample } from "./minimal/MinimalExample";
import { RichExample } from "./rich/RichExample";
import "./styles.css";

type ExampleKey = "minimal" | "rich";

const tabs: { description: string; id: ExampleKey; label: string }[] = [
  {
    description: "验证内容同步和远端光标。",
    id: "minimal",
    label: "最小示例",
  },
  {
    description: "展示扩展能力和外部保存接口。",
    id: "rich",
    label: "完整示例",
  },
];

function getExampleFromHash(): ExampleKey {
  return window.location.hash === "#rich" ? "rich" : "minimal";
}

export default function App() {
  const [example, setExample] = useState<ExampleKey>(() => getExampleFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setExample(getExampleFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="hero__eyebrow">acvil-tiptap/react</p>
        <h1>一个支持协同、光标与内容保存的 Tiptap React 组件库</h1>
        <p className="hero__body">
          这里的示例默认使用本地 <code>Hocuspocus</code> server 做 Yjs 同步。运行{" "}
          <code>vp run example</code>{" "}
          后，你可以在当前页面、多个标签页和新窗口里验证协同编辑与远端光标。
        </p>
      </section>
      <nav aria-label="示例导航" className="tabs">
        {tabs.map((tab) => (
          <a
            className={`tabs__item${example === tab.id ? " tabs__item--active" : ""}`}
            href={`#${tab.id}`}
            key={tab.id}
            onClick={() => {
              setExample(tab.id);
            }}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </a>
        ))}
      </nav>
      {example === "minimal" ? <MinimalExample /> : <RichExample />}
    </main>
  );
}

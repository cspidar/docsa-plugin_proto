import React, { useState } from "react";
import { visit } from "unist-util-visit";

export default function Pick({ path, name, method, url }) {
  const [tree, setTree] = useState(null);
  const tableRows = [];

  // TODO: 문서 경로대로 json 파일 로드
  import(`/.docusaurus/content-sender/default/${path}.json`)
    .then((module) => {
      setTree(module.default);
    })
    .catch((error) => {
      console.error("Failed to load JSON:", error);
    });

  if (tree) {
    //// "기본 정보" 이름이 포함된 제목 찾기
    visit(tree, "heading", (node, index, parent) => {
      node.children.forEach((child) => {
        if (child.type === "text" && /기본 정보\s*/.test(child.value)) {
          //// 위 노드 탐색 - API 이름
          let rowData = {};
          for (let i = index - 1; i >= 0; i--) {
            const prevNode = parent.children[i];
            if (prevNode.type === "heading") {
              const title = prevNode.children[0].value;
              // id 표기 제목에서 제거 ({#ID})
              rowData.name = title.replace(/ *{#.*?}/g, "");
              break;
            }
          }

          //// 아래 노드 탐색 - Method, URL
          for (let i = index + 1; i < parent.children.length; i++) {
            const nextNode = parent.children[i];
            // TODO: 검색 조건 강화 필요
            if (nextNode.type === "table") {
              // TODO: 하드코딩 개선
              rowData.method = nextNode.children[1].children[0].children[0].value;
              rowData.url = nextNode.children[1].children[1].children[0].value;
              break;
            }
          }

          //// prop에 따라 분기 처리(name, method, url)
          if ((name && rowData.name) || (method && rowData.method) || (url && rowData.url)) {
            // path 정보 포함해 고유 key 생성
            const uniqueKey = `${path}-${index}`;

            // 테이블 데이터 추가
            // TODO: 가독성 개선
            tableRows.push(
              <tr key={uniqueKey}>
                {name && <td>{name === "bold" ? <strong>{rowData.name}</strong> : rowData.name}</td>}
                {method && (
                  <td>
                    <code>{rowData.method}</code>
                  </td>
                )}
                {url && <td>{url === "code" ? <code>{rowData.url}</code> : rowData.url}</td>}
              </tr>,
            );
          }
        }
      });
    });
  }
  const tableHeader = (
    <tr>
      {name && <th>API</th>}
      {method && <th>Method</th>}
      {url && <th>URL</th>}
    </tr>
  );

  return (
    <table>
      <thead>{tableHeader}</thead>
      <tbody>{tableRows}</tbody>
    </table>
  );
}

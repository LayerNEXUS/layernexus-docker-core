import React from "react";
import useSchemaStore from "../stores/useSchemaStore";
import ERDPreview from "./MermaidRender";

export default function ERDPanel() {
  // You no longer need uploadResult here
  return <ERDPreview />;
}

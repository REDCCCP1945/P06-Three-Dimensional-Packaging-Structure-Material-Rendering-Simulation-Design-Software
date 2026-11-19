const HelpView = {
  render: function (container) {
    container.innerHTML = UI.pageHead("帮助与合规", "设计流程、技术边界与常见问题") +
      '<div class="two-col"><div class="card"><div class="card-head"><h3>设计流程</h3></div><div class="card-body">' +
      '<ol class="help-list"><li>在包装项目新建项目，填写名称、盒型与长宽高。</li><li>选择材料、颜色与纹理，查看三维预览与刀版图。</li><li>拖拽旋转三维视图，滚轮缩放；导出PNG或SVG。</li><li>生成环保评估，查看面积、重量、成本与碳排。</li><li>保存版本，分享只读链接给客户。</li></ol></div></div>' +
      '<div class="card"><div class="card-head"><h3>技术边界</h3></div><div class="card-body">' +
      '<ul class="help-list"><li>三维预览使用浏览器Canvas透视投影与面排序，不包含Three.js、WebGL 2.0与PBR物理渲染。</li>' +
      '<li>材质以颜色、纹理与粗糙度近似，不包含真实法线贴图与金属度贴图。</li>' +
      '<li>刀版图按简化盒型绘制，不替代印厂专业刀版与打样。</li>' +
      '<li>环保评估采用面积、重量、成本与简化碳因子，不构成完整LCA报告。</li>' +
      '<li>软件不提供云端协同、多租户与Redis缓存。</li></ul></div></div></div>' +
      '<div class="card"><div class="card-head"><h3>常见问题</h3></div><div class="card-body">' +
      '<div class="faq"><strong>三维预览为什么会翻转？</strong><p>拖拽角度超过侧视时，面排序会重新计算；这是正常现象，点击空白处后继续拖拽即可。</p></div>' +
      '<div class="faq"><strong>刀版图尺寸如何换算？</strong><p>刀版图按毫米绘制，画布自适应缩放；导出SVG保留原始毫米坐标。</p></div>' +
      '<div class="faq"><strong>成本与碳排如何计算？</strong><p>面积=2(LW+LH+WH)×1.15；重量=面积×克重；成本=面积×单价；碳排=重量×碳因子；综合分=可回收×0.6+(100-碳排×40)×0.4。</p></div>' +
      '<div class="faq"><strong>分享页显示什么？</strong><p>分享页只显示项目名称、盒型、尺寸、材料与面积/重量/可回收分，不显示成本与碳排。</p></div>' +
      '<div class="faq"><strong>数据保存在哪里？</strong><p>保存在软件目录的data/db.json；备份时同时保留secret.key。</p></div>' +
      '</div></div>';
  }
};
App.register("help", HelpView);

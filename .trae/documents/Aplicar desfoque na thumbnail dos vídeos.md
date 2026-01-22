O plano é adicionar `filter: blur(2px)` à imagem da thumbnail na lista de gerenciamento de vídeos (`src/pages/editors/VideoEditor.tsx`). Isso fará com que a imagem fique levemente desfocada, conforme solicitado.

**Passos:**
1.  Editar o arquivo `src/pages/editors/VideoEditor.tsx`.
2.  Localizar a tag `<img>` que exibe a thumbnail na lista de vídeos (linha 190).
3.  Adicionar `filter: 'blur(2px)'` ao objeto `style` da imagem, mantendo a opacidade `0.6` já configurada.

Deseja que eu prossiga com essa alteração?
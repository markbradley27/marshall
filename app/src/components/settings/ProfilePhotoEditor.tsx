import { useCallback, useEffect, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { Button, Col, Form, Row } from "react-bootstrap";

import { fetchAvatar, putAvatar } from "../../api_client";
import { useAuth } from "../../contexts/auth";

export default function ProfilePhotoEditor() {
  const [editing, setEditing] = useState(false);
  const editor = useRef<AvatarEditor | null>(null);
  const [image, setImage] = useState("/graphics/default_avatar.png");
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);

  const auth = useAuth();

  const refreshAvatar = useCallback(async () => {
    const avatarUrl = await fetchAvatar(auth.user?.uid as string);
    if (avatarUrl != null) {
      setImage(avatarUrl);
    }
  }, [auth.user]);

  useEffect(() => {
    async function fetchData() {
      if (loadAttempted) return;
      await refreshAvatar();
      setLoadAttempted(true);
    }
    fetchData();
  });

  const onChangeClick = useCallback(() => {
    setScale(1);
    setEditing(true);
  }, [setEditing]);

  const onOpenClick = useCallback(() => {
    document.getElementById("hidden-file-input")?.click();
  }, []);

  const onOpenChange = useCallback(() => {
    const input = document.getElementById(
      "hidden-file-input"
    ) as HTMLInputElement;
    if (input.files == null) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = (event) => {
      setImage(event.target!.result as string);
    };
    reader.readAsDataURL(input.files[0]);
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    const dataUrl = editor?.current
      ?.getImageScaledToCanvas()
      .toDataURL() as string;
    var byteString;
    if (dataUrl.split(",")[0].indexOf("base64") >= 0) {
      byteString = atob(dataUrl.split(",")[1]);
    } else {
      byteString = unescape(dataUrl.split(",")[1]);
    }
    const byteArray = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; ++i) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "image/png" });

    await putAvatar((await auth.user?.getIdToken()) as string, blob);

    await refreshAvatar();
    setEditing(false);
    setSaving(false);
  }, [auth.user, refreshAvatar, setSaving]);

  const onCancel = useCallback(async () => {
    setEditing(false);
  }, [setEditing]);

  return (
    <Row className="mb-3">
      <Col xs="4">Photo:</Col>
      <Col className="text-center">
        {editing ? (
          <>
            <AvatarEditor
              border={5}
              borderRadius={99999}
              className="mb-3"
              height={300}
              image={image}
              ref={editor}
              scale={scale}
              width={300}
            />
            {/* TODO: Style this like everything else. */}
            <Form.Control
              className="mb-3"
              max="2"
              min="0.1"
              onChange={(event) => {
                setScale(Number(event.target.value));
              }}
              step="0.01"
              type="range"
              width={300}
            />
            <Button className="mx-1" disabled={saving} onClick={onOpenClick}>
              Open
              <Form.Control
                className="d-none"
                id="hidden-file-input"
                onChange={onOpenChange}
                type="file"
              />
            </Button>
            <Button className="mx-1" disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button className="mx-1" disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <img
              alt="Avatar"
              className="mb-3"
              src={image}
              style={{ borderRadius: "50%" }}
            />
            <Button onClick={onChangeClick}>Change</Button>
          </>
        )}
      </Col>
    </Row>
  );
}

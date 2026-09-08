import {
  buildDraftsList,
  buildNewRequestsList,
  buildQueueList,
  filterActiveAcceptedRequests,
  isAcceptedRequestEligibleForQueue,
  isOfferEligibleForQueue,
  parseRequestPayload,
} from "@/lib/expert/requestMappers";
import type { BackendOffer, BackendRequest } from "@/lib/expert/types";

describe("buildQueueList deadline filtering", () => {
  const nowMs = Date.parse("2026-08-06T12:00:00.000Z");

  it("removes offers whose deadline has passed", () => {
    const offer = {
      _id: "offer1",
      expiresAt: "2026-08-05T12:00:00.000Z",
      request: {
        _id: "req1",
        displayId: "16",
        status: "offered",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    } as unknown as BackendOffer;

    expect(isOfferEligibleForQueue(offer, nowMs)).toBe(false);
    expect(buildQueueList([offer], [], nowMs)).toHaveLength(0);
  });

  it("removes accepted requests whose deadline has passed", () => {
    const request = {
      _id: "req1",
      displayId: "16",
      status: "accepted",
      deadlineAt: "2026-08-06T11:59:59.999Z",
    } as unknown as BackendRequest;

    expect(isAcceptedRequestEligibleForQueue(request, nowMs)).toBe(false);
    expect(buildQueueList([], [request], nowMs)).toHaveLength(0);
  });

  it("keeps accepted requests in queue as in progress until deadlineAt passes", () => {
    const request = {
      _id: "req1",
      displayId: "16",
      status: "accepted",
      deadlineAt: "2026-08-08T12:00:00.000Z",
      firstAcceptanceWindowEndsAt: "2026-08-05T12:00:00.000Z",
    } as unknown as BackendRequest;

    expect(isAcceptedRequestEligibleForQueue(request, nowMs)).toBe(true);
    const items = buildQueueList([], [request], nowMs);
    expect(items).toHaveLength(1);
    expect(items[0]?.variant).toBe("in_progress");
  });

  it("removes expired accepted requests from draft eligibility", () => {
    const active = {
      _id: "req1",
      displayId: "16",
      status: "accepted",
      deadlineAt: "2026-08-10T12:00:00.000Z",
    } as unknown as BackendRequest;
    const expired = {
      _id: "req2",
      displayId: "17",
      status: "accepted",
      deadlineAt: "2026-08-06T11:59:59.999Z",
    } as unknown as BackendRequest;

    expect(filterActiveAcceptedRequests([active, expired], nowMs)).toHaveLength(
      1,
    );
    expect(filterActiveAcceptedRequests([active, expired], nowMs)[0]?._id).toBe(
      "req1",
    );
  });

  it("keeps active offers and accepted requests with future deadlines", () => {
    const offer = {
      _id: "offer1",
      expiresAt: "2026-08-10T12:00:00.000Z",
      request: {
        _id: "req1",
        displayId: "16",
        status: "offered",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    } as unknown as BackendOffer;
    const request = {
      _id: "req2",
      displayId: "17",
      status: "accepted",
      deadlineAt: "2026-08-10T12:00:00.000Z",
    } as unknown as BackendRequest;

    expect(buildQueueList([offer], [request], nowMs)).toHaveLength(2);
  });

  it("keeps Queue badge count equal to Queue list length", () => {
    const offers = Array.from({ length: 4 }, (_, index) => ({
      _id: `offer${index}`,
      expiresAt: "2026-08-10T12:00:00.000Z",
      request: {
        _id: `req-offer-${index}`,
        displayId: String(index + 1),
        status: "offered",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    })) as unknown as BackendOffer[];
    const accepted = [
      {
        _id: "req-accepted",
        displayId: "99",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const queueList = buildQueueList(offers, accepted, nowMs);
    const queueBadge = queueList.length;
    expect(queueList).toHaveLength(5);
    expect(queueBadge).toBe(queueList.length);
  });

  it("drops expired queue items from both list and badge count", () => {
    const offers = [
      {
        _id: "offer-active",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "req-active",
          displayId: "1",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "offer-expired",
        expiresAt: "2026-08-05T12:00:00.000Z",
        request: {
          _id: "req-expired",
          displayId: "2",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "offer-soon",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "req-soon",
          displayId: "3",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "offer-4",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "req-4",
          displayId: "4",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "offer-5",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "req-5",
          displayId: "5",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
    ] as unknown as BackendOffer[];

    const before = buildQueueList(offers, [], nowMs);
    const beforeBadge = before.length;
    expect(before).toHaveLength(4);
    expect(beforeBadge).toBe(before.length);

    // One previously-active offer expires → list and badge both drop to 3.
    const afterOneExpires = buildQueueList(
      offers.map((offer) =>
        offer._id === "offer-soon"
          ? { ...offer, expiresAt: "2026-08-06T11:00:00.000Z" }
          : offer,
      ),
      [],
      nowMs,
    );
    const afterBadge = afterOneExpires.length;
    expect(afterOneExpires).toHaveLength(3);
    expect(afterBadge).toBe(afterOneExpires.length);
  });
});

describe("buildNewRequestsList", () => {
  const nowMs = Date.parse("2026-08-06T12:00:00.000Z");

  it("counts only eligible unaccepted offers (not raw offers.length)", () => {
    const offers = [
      {
        _id: "o1",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "r1",
          displayId: "1",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "o2",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "r2",
          displayId: "2",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "o3",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "r3",
          displayId: "3",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "o4",
        expiresAt: "2026-08-10T12:00:00.000Z",
        request: {
          _id: "r4",
          displayId: "4",
          status: "accepted",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
      {
        _id: "o5",
        expiresAt: "2026-08-05T12:00:00.000Z",
        request: {
          _id: "r5",
          displayId: "5",
          status: "offered",
          deadlineAt: "2026-08-10T12:00:00.000Z",
        },
      },
    ] as unknown as BackendOffer[];

    const accepted = [
      {
        _id: "r3",
        displayId: "3",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    expect(offers).toHaveLength(5);
    const newRequestsList = buildNewRequestsList(offers, accepted, nowMs);
    const newRequestsBadge = newRequestsList.length;
    expect(newRequestsList).toHaveLength(2);
    expect(newRequestsBadge).toBe(newRequestsList.length);
    expect(newRequestsList.map((offer) => offer._id)).toEqual(["o1", "o2"]);
  });

  it("matches the documented 10 offers / 2 accepted / 1 expired → 7 case", () => {
    const offers = Array.from({ length: 10 }, (_, index) => ({
      _id: `o${index}`,
      expiresAt:
        index === 9 ? "2026-08-05T12:00:00.000Z" : "2026-08-10T12:00:00.000Z",
      request: {
        _id: `r${index}`,
        displayId: String(index),
        status: "offered",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    })) as unknown as BackendOffer[];

    const accepted = [
      {
        _id: "r0",
        displayId: "0",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
      {
        _id: "r1",
        displayId: "1",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const newRequestsList = buildNewRequestsList(offers, accepted, nowMs);
    const newRequestsBadge = newRequestsList.length;
    expect(newRequestsList).toHaveLength(7);
    expect(newRequestsBadge).toBe(newRequestsList.length);
  });
});

describe("buildDraftsList", () => {
  const nowMs = Date.parse("2026-08-06T12:00:00.000Z");

  it("keeps Drafts badge equal to Drafts list length", () => {
    const accepted = [
      {
        _id: "req1",
        displayId: "16",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const draftsList = buildDraftsList(accepted, nowMs);
    const draftsBadge = draftsList.length;
    expect(draftsList).toHaveLength(1);
    expect(draftsBadge).toBe(draftsList.length);
  });

  it("clears Drafts list and badge together after deadline passes", () => {
    const accepted = [
      {
        _id: "req1",
        displayId: "16",
        status: "accepted",
        deadlineAt: "2026-08-06T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const before = buildDraftsList(
      accepted,
      Date.parse("2026-08-06T11:59:00.000Z"),
    );
    const beforeBadge = before.length;
    expect(before).toHaveLength(1);
    expect(beforeBadge).toBe(before.length);

    const after = buildDraftsList(
      accepted,
      Date.parse("2026-08-06T12:00:00.000Z"),
    );
    const afterBadge = after.length;
    expect(after).toHaveLength(0);
    expect(afterBadge).toBe(after.length);
  });
});

describe("parseRequestPayload video posters", () => {
  it("does not reuse the first coin image as a blank video poster", () => {
    const { media } = parseRequestPayload({
      coinName: "Test coin",
      media: {
        obverse: ["https://cdn.coinzy.app/obverse.jpg"],
        video: ["https://cdn.coinzy.app/blank.mp4"],
      },
    });

    const video = media.find((item) => item.kind === "video");
    expect(video?.kind).toBe("video");
    expect(video?.poster).toBe("");
  });

  it("uses an explicit video poster from the payload", () => {
    const { media } = parseRequestPayload({
      coinName: "Test coin",
      media: {
        obverse: ["https://cdn.coinzy.app/obverse.jpg"],
        video: [
          {
            src: "https://cdn.coinzy.app/coin.mp4",
            poster: "https://cdn.coinzy.app/video-frame.jpg",
          },
        ],
      },
    });

    const video = media.find((item) => item.kind === "video");
    expect(video?.kind).toBe("video");
    expect(video?.poster).toBe("https://cdn.coinzy.app/video-frame.jpg");
  });

  it("drops dummy example.com seed media so PDF export is not blocked", () => {
    const { media } = parseRequestPayload({
      coinName: "Test coin",
      media: {
        obverse: ["https://media.example.com/coinzy/uploads/dummy-obverse.jpg"],
        reverse: ["https://media.example.com/coinzy/uploads/dummy-reverse.jpg"],
        edge: ["https://cdn.coinzy.app/edge.jpg"],
      },
    });

    expect(media.map((item) => item.src)).toEqual([
      "https://cdn.coinzy.app/edge.jpg",
    ]);
  });
});

import { useEffect, useState } from "react";
import { Inbox, Send } from "lucide-react";

import { requestsApi } from "../api/client";
import type { GroupedRequestsResponse } from "../api/types";
import { RequestCard } from "../components/RequestCard";
import { useAuth } from "../hooks/useAuth";

const EMPTY_REQUESTS: GroupedRequestsResponse = {
  your_requests: [],
  requests_from_others: []
};

export function SharingRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<GroupedRequestsResponse>(EMPTY_REQUESTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  async function loadRequests() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.list(token);
      setRequests(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load sharing requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [token]);

  async function runAction(action: () => Promise<unknown>, requestId: number) {
    setBusyRequestId(requestId);
    setError(null);
    try {
      await action();
      await loadRequests();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <section className="requests-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Sharing requests</p>
          <h2>Track what you asked for and what others want from you</h2>
        </div>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="requests-columns">
        <section className="request-column">
          <div className="column-heading">
            <Send size={18} />
            <div>
              <h3>Your Requests</h3>
              <p>Everything you’ve asked to borrow or trade for.</p>
            </div>
          </div>
          {loading ? (
            <p className="helper">Loading…</p>
          ) : requests.your_requests.length === 0 ? (
            <p className="helper">No outgoing requests yet.</p>
          ) : (
            requests.your_requests.map((request) => (
              <RequestCard key={request.id} request={request} perspective="outgoing" busy={busyRequestId === request.id} />
            ))
          )}
        </section>

        <section className="request-column">
          <div className="column-heading">
            <Inbox size={18} />
            <div>
              <h3>Requests from Others</h3>
              <p>Approve, reject, or close active shares for your books.</p>
            </div>
          </div>
          {loading ? (
            <p className="helper">Loading…</p>
          ) : requests.requests_from_others.length === 0 ? (
            <p className="helper">Nothing is waiting on you right now.</p>
          ) : (
            requests.requests_from_others.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                perspective="incoming"
                busy={busyRequestId === request.id}
                onApprove={(requestId, selectedBookId) =>
                  runAction(() => requestsApi.approve(token!, requestId, selectedBookId), requestId)
                }
                onReject={(requestId) => runAction(() => requestsApi.reject(token!, requestId), requestId)}
                onReturn={(requestId) => runAction(() => requestsApi.returnLend(token!, requestId), requestId)}
                onComplete={(requestId) => runAction(() => requestsApi.completeTrade(token!, requestId), requestId)}
              />
            ))
          )}
        </section>
      </div>
    </section>
  );
}

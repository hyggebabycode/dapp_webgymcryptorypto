import { AddPtRequestDialog } from "@/components/admin/add-pt-request-dialog";
import { PtRequestActions, type PtRequestRecord } from "@/components/admin/pt-request-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { RealtimeFilter } from "@/components/realtime-filter";
import {
  deleteEnrollmentAction,
  updateEnrollmentStatusAction,
} from "@/lib/admin/actions";
import { compactAddress, formatDateTime, paymentAmountToTest } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EnrollmentRow = {
  id: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  payment_token_amount?: number | null;
  payment_currency?: string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  payer_wallet?: string | null;
  tx_hash?: string | null;
  enrollment_date?: string | null;
  users: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

type PtRequestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  certification: string | null;
  pt_request_note?: string | null;
};

function parseCvStoragePath(note?: string | null) {
  const match = (note || "").match(/Đường dẫn storage:\s*([^\s]+)/i);
  return match?.[1] || null;
}

function parseCvPublicPath(note?: string | null) {
  const match = (note || "").match(/Đường dẫn file:\s*([^\s]+)/i);
  const publicPath = match?.[1] || null;
  return publicPath?.startsWith("/uploads/") ? publicPath : null;
}

function parseCvLabel(note?: string | null) {
  const match = (note || "").match(/File chứng nhận\/CV:\s*([^\n]+)/i);
  return match?.[1] || null;
}

function parseTeachingAvailability(note?: string | null) {
  const match = (note || "").match(/Thời gian có thể dạy:\s*([^\n]+)/i);
  return match?.[1]?.trim() || null;
}

function safeStorageName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function labelFromStoredName(value: string) {
  return value.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
}

async function getSignedCvUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  note?: string | null,
) {
  const storagePath = parseCvStoragePath(note);
  if (!storagePath) return null;

  const [bucket, ...pathParts] = storagePath.split("/");
  const path = pathParts.join("/");
  if (!bucket || !path) return null;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (error) return null;
  return data.signedUrl;
}

async function getStoredCvInfo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  email: string,
) {
  const bucket = "pt-application-files";
  const folder = safeStorageName(email);
  if (!folder) return null;

  const { data: files, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error || !files || files.length === 0) return null;

  const file = files[0];
  const path = `${folder}/${file.name}`;
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 30);

  if (signedError) return null;

  return {
    label: labelFromStoredName(file.name),
    signedUrl: signedData.signedUrl,
  };
}

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật đăng ký thành công.";
  if (error === "image_invalid") return "Ảnh tải lên phải là file ảnh và dung lượng không quá 3MB.";
  if (error) return "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu và thử lại.";
  return null;
}

const enrollmentButtonClass =
  "inline-flex h-9 w-[104px] items-center justify-center rounded-lg border text-xs font-black transition";

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  let enrollmentsError = params.error || "";

  const enrollmentsWithTxResult = await supabase
    .from("class_enrollments")
    .select("id, status, payment_status, payment_amount, payment_token_amount, payment_currency, payment_method, payment_date, payer_wallet, tx_hash, enrollment_date, users(full_name, email), courses(course_name)")
    .order("enrollment_date", { ascending: false });

  let enrollmentsData = enrollmentsWithTxResult.data as EnrollmentRow[] | null;

  if (enrollmentsWithTxResult.error) {
    const fallbackResult = await supabase
      .from("class_enrollments")
      .select("id, status, payment_status, payment_amount, enrollment_date, users(full_name, email), courses(course_name)")
      .order("enrollment_date", { ascending: false });
    enrollmentsData = fallbackResult.data as EnrollmentRow[] | null;
    if (fallbackResult.error) enrollmentsError = "load_failed";
  }

  const ptRequestsResult = await supabase
    .from("users")
    .select("id, full_name, email, phone, address, bio, specialization, years_of_experience, certification, pt_request_note")
    .eq("requested_role", "coach")
    .neq("role", "coach")
    .order("created_at", { ascending: false });

  let ptRequestsData = (ptRequestsResult.data || []) as PtRequestRow[];
  if (ptRequestsResult.error) {
    const fallbackPtRequests = await supabase
      .from("users")
      .select("id, full_name, email, phone, address, bio, specialization, years_of_experience, certification")
      .eq("requested_role", "coach")
      .neq("role", "coach")
      .order("created_at", { ascending: false });
    ptRequestsData = ((fallbackPtRequests.data || []) as PtRequestRow[]).map((request) => ({
      ...request,
      pt_request_note: null,
    }));
  }

  const enrollments = enrollmentsData || [];
  const ptRequests: PtRequestRecord[] = await Promise.all(
    ptRequestsData.map(async (request) => {
      const noteSignedUrl = await getSignedCvUrl(supabase, request.pt_request_note);
      const publicFileUrl = parseCvPublicPath(request.pt_request_note);
      const storedFile = noteSignedUrl || publicFileUrl ? null : await getStoredCvInfo(supabase, request.email);

      return {
        ...request,
        cvSignedUrl: noteSignedUrl || publicFileUrl || storedFile?.signedUrl || null,
        cvLabel: parseCvLabel(request.pt_request_note) || storedFile?.label || null,
        teachingAvailability: parseTeachingAvailability(request.pt_request_note),
      };
    }),
  );
  const message = messageText(params.updated, enrollmentsError);

  return (
    <div className="space-y-6" id="admin-enrollments-page">
      <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black">Đăng ký</h1>
            <p className="mt-2 text-sm text-muted">
              Theo dõi đăng ký khóa học, thanh toán và yêu cầu đăng ký làm PT.
            </p>
          </div>
          <AddPtRequestDialog />
        </div>

        {message ? (
          <div className={`mt-5 rounded-lg px-4 py-3 text-sm font-bold ${enrollmentsError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        ) : null}

        <RealtimeFilter
          className="mt-6"
          initialQuery={params.q || ""}
          placeholder="Tìm học viên, khóa học, mã giao dịch hoặc ứng viên PT..."
          scopeId="admin-enrollments-page"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <a className="inline-flex h-10 w-[170px] items-center justify-center rounded-lg bg-primary text-sm font-black text-white" href="#course-enrollments">
            Đăng ký khóa học ({enrollments.length})
          </a>
          <a className="inline-flex h-10 w-[170px] items-center justify-center rounded-lg border border-pink-100 bg-white text-sm font-black text-primary hover:bg-primary-soft" href="#pt-requests">
            Đăng ký làm PT ({ptRequests.length})
          </a>
        </div>
      </section>

      <section id="course-enrollments" className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Đăng ký khóa học</h2>
        <div className="mt-5 overflow-x-auto rounded-xl border border-pink-100">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-primary-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Khóa học</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Giao dịch / Ví</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="w-[236px] px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {enrollments.map((enrollment) => {
                const user = one(enrollment.users);
                const course = one(enrollment.courses);
                const searchText = `${user?.full_name || ""} ${user?.email || ""} ${course?.course_name || ""} ${enrollment.tx_hash || ""} ${enrollment.payer_wallet || ""} ${enrollment.status} ${enrollment.payment_status || ""}`;

                return (
                  <tr className="hover:bg-primary-soft/60" data-filter-item data-search={searchText} key={enrollment.id}>
                    <td className="px-4 py-4">
                      <p className="font-black">{user?.full_name || "Học viên"}</p>
                      <p className="text-xs text-muted">{user?.email || "Chưa có email"}</p>
                    </td>
                    <td className="px-4 py-4 text-muted">{course?.course_name || "Khóa học"}</td>
                    <td className="px-4 py-4">
                      <p className="font-black text-primary">
                        {paymentAmountToTest({
                          baseAmount: enrollment.payment_amount,
                          tokenAmount: enrollment.payment_token_amount,
                        })}
                      </p>
                      <p className="text-xs text-muted">
                        {enrollment.payment_method === "metamask_sapphire" ? "MetaMask" : enrollment.payment_status || "pending"}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-4 py-4 text-xs font-bold text-muted">
                      <p title={enrollment.tx_hash || ""}>{compactAddress(enrollment.tx_hash, 10, 8)}</p>
                      <p className="mt-1 font-mono" title={enrollment.payer_wallet || ""}>
                        {compactAddress(enrollment.payer_wallet)}
                      </p>
                      <p className="mt-1 text-[11px]">{formatDateTime(enrollment.payment_date || enrollment.enrollment_date)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="w-[236px] px-4 py-4">
                      <div className="grid grid-cols-2 gap-2">
                        {["active", "completed", "cancelled"].map((status) => (
                          <form action={updateEnrollmentStatusAction} key={status}>
                            <input name="enrollment_id" type="hidden" value={enrollment.id} />
                            <input name="status" type="hidden" value={status} />
                            <ConfirmSubmitButton
                              className={`${enrollmentButtonClass} border-pink-100 text-primary hover:bg-primary hover:text-white`}
                              message={
                                status === "cancelled"
                                  ? `Hủy đăng ký của ${user?.full_name || "học viên"}?`
                                  : `Cập nhật đăng ký sang trạng thái ${status}?`
                              }
                            >
                              {status === "active" ? "Kích hoạt" : status === "completed" ? "Hoàn thành" : "Hủy"}
                            </ConfirmSubmitButton>
                          </form>
                        ))}
                        <form action={deleteEnrollmentAction}>
                          <input name="enrollment_id" type="hidden" value={enrollment.id} />
                          <ConfirmSubmitButton
                            className={`${enrollmentButtonClass} border-red-100 bg-red-50 text-red-600 hover:bg-red-100`}
                            message={`Lưu trữ đăng ký của ${user?.full_name || "học viên"}?`}
                          >
                            Lưu trữ
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="pt-requests" className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black">Đăng ký làm PT</h2>
            <p className="mt-2 text-sm text-muted">Ứng viên đã gửi yêu cầu xin cấp quyền huấn luyện viên.</p>
          </div>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
            {ptRequests.length} chờ duyệt
          </span>
        </div>

        <div className="space-y-3">
          {ptRequests.length > 0 ? (
            ptRequests.map((request) => (
              <article
                className="rounded-xl border border-pink-100 bg-background p-4"
                data-filter-item
                data-search={`${request.full_name} ${request.email} ${request.phone || ""} ${request.address || ""} ${request.specialization || ""} ${request.certification || ""} ${request.bio || ""} ${request.pt_request_note || ""}`}
                key={request.id}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="font-black">{request.full_name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {request.email} · {request.phone || "Chưa có SĐT"} · {request.address || "Chưa có khu vực"}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-black text-primary">Chuyên môn:</span>{" "}
                      {request.specialization || "Chưa cập nhật"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {request.years_of_experience ?? 0} năm kinh nghiệm · {request.certification || "Chưa có chứng chỉ"}
                    </p>
                    {request.bio ? <p className="mt-2 max-w-3xl text-sm text-muted">{request.bio}</p> : null}
                    {request.cvLabel ? (
                      <p className="mt-2 text-xs font-black text-primary">
                        CV/chứng nhận: {request.cvSignedUrl ? "có thể xem file" : request.cvLabel}
                      </p>
                    ) : null}
                  </div>
                  <PtRequestActions request={request} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl bg-green-50 px-4 py-4 text-sm font-bold text-green-700">
              Hiện chưa có yêu cầu đăng ký làm PT.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

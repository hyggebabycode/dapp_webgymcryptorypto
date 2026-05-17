// =====================================================
// GYMHEART SMART CONTRACT PAYMENT - OASIS SAPPHIRE TESTNET
// =====================================================

(function () {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  const paymentConfig = {
    networkName: "Oasis Sapphire Testnet",
    chainIdHex: "0x5AFF",
    chainIdDecimal: 23295,
    rpcUrls: ["https://testnet.sapphire.oasis.dev"],
    nativeCurrency: {
      name: "TEST",
      symbol: "TEST",
      decimals: 18,
    },
    adminWallet: "0xC91DD3d721f7146e4DC759716b158546F2a4E551",
    contractAddress:
      localStorage.getItem("gymheart_payment_contract_address") ||
      window.GYMHEART_PAYMENT_CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    vndPerTest: Number(localStorage.getItem("gymheart_vnd_per_test")) || 1000000,
    abi: [
      {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
        ],
        name: "payForCourse",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "withdrawFunds",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "totalPaidByCourse",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "paidByStudent",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "CoursePaid",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "admin",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "FundsWithdrawn",
        type: "event",
      },
    ],
  };

  let selectedCourse = null;
  let selectedUser = null;
  let statusHandler = null;

  function getSupabaseClient() {
    if (!window.supabaseClient) {
      throw new Error("Khong the ket noi Supabase.");
    }
    return window.supabaseClient;
  }

  function getCurrentUser() {
    const userStr = localStorage.getItem("gymheart_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Invalid user session:", error);
      return null;
    }
  }

  function getModalElement(id) {
    return document.getElementById(id);
  }

  function setPaymentStatus(message, type = "info") {
    if (typeof statusHandler === "function") {
      statusHandler(message, type);
    }

    const statusEl = getModalElement("web3-payment-status");
    if (!statusEl) return;

    statusEl.classList.remove(
      "hidden",
      "bg-blue-50",
      "text-blue-700",
      "bg-green-50",
      "text-green-700",
      "bg-red-50",
      "text-red-700",
    );

    const classes =
      type === "success"
        ? ["bg-green-50", "text-green-700"]
        : type === "error"
          ? ["bg-red-50", "text-red-700"]
          : ["bg-blue-50", "text-blue-700"];

    statusEl.classList.add(...classes);
    statusEl.textContent = message;
  }

  function setPayButtonLoading(isLoading) {
    const btn = getModalElement("web3-pay-button");
    const btnText = getModalElement("web3-pay-button-text");
    if (!btn || !btnText) return;

    btn.disabled = isLoading;
    btn.classList.toggle("opacity-70", isLoading);
    btn.classList.toggle("cursor-not-allowed", isLoading);
    btnText.textContent = isLoading ? "Dang xu ly..." : "Thanh toan Token (MetaMask)";
  }

  function closeCoursePaymentModal() {
    const modal = getModalElement("course-payment-modal");
    if (!modal) return;

    modal.classList.add("hidden");
    selectedCourse = null;
    selectedUser = null;
    setPayButtonLoading(false);
  }

  function formatCurrency(amount) {
    if (typeof window.formatCurrency === "function") {
      return window.formatCurrency(amount);
    }

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  function shortHash(hash) {
    if (!hash) return "";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  function uuidToUint256(courseId) {
    const hex = String(courseId || "").replace(/-/g, "");
    if (!/^[0-9a-fA-F]{1,64}$/.test(hex)) {
      throw new Error("Ma khoa hoc khong hop le de ghi on-chain.");
    }

    return BigInt(`0x${hex}`).toString();
  }

  function getTokenAmountString(course) {
    const priceVnd = Number(course.price || 0);
    if (!Number.isFinite(priceVnd) || priceVnd <= 0) {
      throw new Error("Hoc phi khong hop le.");
    }

    const tokenAmount = priceVnd / paymentConfig.vndPerTest;
    if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
      throw new Error("Ty gia VND/TEST khong hop le.");
    }

    return tokenAmount
      .toFixed(18)
      .replace(/0+$/, "")
      .replace(/\.$/, "");
  }

  function assertWeb3Ready() {
    if (!window.ethereum) {
      throw new Error("Vui long cai dat MetaMask de thanh toan bang token.");
    }

    if (!window.ethers) {
      throw new Error("Khong the tai thu vien Ethers.js. Vui long tai lai trang.");
    }

    if (
      !paymentConfig.contractAddress ||
      paymentConfig.contractAddress === ZERO_ADDRESS ||
      !window.ethers.isAddress(paymentConfig.contractAddress)
    ) {
      throw new Error(
        "Chua cau hinh Contract Address. Hay deploy contract roi cap nhat js/web3-smart-payment.js hoac localStorage gymheart_payment_contract_address.",
      );
    }
  }

  async function ensureSapphireTestnet() {
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId?.toLowerCase() === paymentConfig.chainIdHex.toLowerCase()) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: paymentConfig.chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code !== 4902) {
        throw switchError;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: paymentConfig.chainIdHex,
            chainName: paymentConfig.networkName,
            nativeCurrency: paymentConfig.nativeCurrency,
            rpcUrls: paymentConfig.rpcUrls,
          },
        ],
      });
    }
  }

  async function payForCourseOnChain(course) {
    assertWeb3Ready();
    setPaymentStatus("Dang ket noi MetaMask...", "info");

    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureSapphireTestnet();

    const provider = new window.ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new window.ethers.Contract(
      paymentConfig.contractAddress,
      paymentConfig.abi,
      signer,
    );

    const courseIdOnChain = uuidToUint256(course.id);
    const tokenAmount = getTokenAmountString(course);
    const value = window.ethers.parseEther(tokenAmount);

    setPaymentStatus(
      `Vui long xac nhan giao dich ${tokenAmount} TEST trong MetaMask...`,
      "info",
    );

    const tx = await contract.payForCourse(courseIdOnChain, { value });

    setPaymentStatus(`Dang cho block xac nhan: ${shortHash(tx.hash)}`, "info");
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Giao dich on-chain khong thanh cong.");
    }

    return {
      txHash: tx.hash,
      tokenAmount,
      courseIdOnChain,
      walletAddress: await signer.getAddress(),
    };
  }

  async function upsertEnrollmentAfterPayment(course, user, payment) {
    const supabaseClient = getSupabaseClient();
    const now = new Date().toISOString();
    const buildPayload = (includeTxHash) => {
      const payload = {
        enrollment_date: now,
        status: "active",
        payment_status: "paid",
        payment_method: "metamask_sapphire",
        payment_amount: course.price,
        payment_date: now,
        notes: `Thanh toan ${payment.tokenAmount} TEST qua MetaMask tren Oasis Sapphire Testnet. Wallet: ${payment.walletAddress}. Tx: ${payment.txHash}`,
      };

      if (includeTxHash) {
        payload.tx_hash = payment.txHash;
      }

      return payload;
    };

    const isTxHashSchemaCacheError = (error) => {
      const text = [
        error?.code,
        error?.message,
        error?.details,
        error?.hint,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes("tx_hash") &&
        (text.includes("schema cache") ||
          text.includes("pgrst204") ||
          text.includes("could not find") ||
          text.includes("does not exist"))
      );
    };

    const saveEnrollment = async (includeTxHash) => {
      const payload = buildPayload(includeTxHash);

      const { data: existingEnrollment, error: existingError } =
        await supabaseClient
          .from("class_enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle();

      if (existingError) throw existingError;

      if (existingEnrollment) {
        const { error } = await supabaseClient
          .from("class_enrollments")
          .update(payload)
          .eq("id", existingEnrollment.id);

        if (error) throw error;
        return;
      }

      const { error } = await supabaseClient.from("class_enrollments").insert({
        user_id: user.id,
        course_id: course.id,
        ...payload,
      });

      if (error) throw error;
    };

    try {
      await saveEnrollment(true);
    } catch (error) {
      if (!isTxHashSchemaCacheError(error)) {
        throw error;
      }

      console.warn(
        "Supabase schema cache does not expose tx_hash yet. Saving enrollment without tx_hash column; tx hash is kept in notes.",
        error,
      );
      await saveEnrollment(false);
    }
  }

  async function fetchCourse(courseId) {
    const cachedCourse = window.gymheartCoursesById?.[courseId];
    if (cachedCourse) return cachedCourse;

    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error) throw error;
    return data;
  }

  async function validateCourseEnrollment(course, user) {
    if (!course) {
      throw new Error("Khong tim thay khoa hoc.");
    }

    if (Number(course.current_students || 0) >= Number(course.max_students || 0)) {
      throw new Error("Khoa hoc da day.");
    }

    const supabaseClient = getSupabaseClient();
    const { data: existingEnrollment, error } = await supabaseClient
      .from("class_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    if (existingEnrollment) {
      throw new Error("Ban da dang ky khoa hoc nay roi.");
    }
  }

  function renderModalCourse(course) {
    const title = getModalElement("payment-course-title");
    const image = getModalElement("payment-course-image");
    const meta = getModalElement("payment-course-meta");
    const price = getModalElement("payment-course-price");
    const tokenAmount = getModalElement("payment-token-amount");
    const contractAddress = getModalElement("payment-contract-address");

    if (title) title.textContent = course.course_name;
    if (image) {
      image.src =
        course.image_url ||
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
      image.alt = course.course_name;
    }
    if (meta) {
      meta.textContent = `${course.duration_weeks} tuan - ${course.current_students}/${course.max_students} hoc vien`;
    }
    if (price) price.textContent = formatCurrency(course.price);
    if (tokenAmount) tokenAmount.textContent = `${getTokenAmountString(course)} TEST`;
    if (contractAddress) {
      contractAddress.textContent =
        paymentConfig.contractAddress === ZERO_ADDRESS
          ? "Chua cau hinh"
          : paymentConfig.contractAddress;
    }
  }

  async function openCoursePaymentModal(courseId) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "auth.html";
      return;
    }

    const modal = getModalElement("course-payment-modal");
    if (!modal) return;

    try {
      setPaymentStatus("Dang tai thong tin thanh toan...", "info");
      selectedUser = user;
      selectedCourse = await fetchCourse(courseId);
      await validateCourseEnrollment(selectedCourse, selectedUser);
      renderModalCourse(selectedCourse);

      modal.classList.remove("hidden");
      setPaymentStatus(
        "MetaMask se goi ham payForCourse() tren Smart Contract.",
        "info",
      );
    } catch (error) {
      console.error("Open payment modal error:", error);
      alert(error.message || "Khong the mo thanh toan.");
      closeCoursePaymentModal();
    }
  }

  async function paySelectedCourseWithMetaMask() {
    if (!selectedCourse || !selectedUser) {
      alert("Khong co khoa hoc nao duoc chon.");
      return;
    }

    try {
      setPayButtonLoading(true);
      const payment = await payForCourseOnChain(selectedCourse);

      setPaymentStatus("Giao dich thanh cong. Dang dong bo Supabase...", "info");
      await upsertEnrollmentAfterPayment(selectedCourse, selectedUser, payment);

      setPaymentStatus(
        `Thanh toan thanh cong. Tx: ${shortHash(payment.txHash)}`,
        "success",
      );

      if (typeof window.loadCourses === "function") {
        await window.loadCourses();
      }
      if (typeof window.loadOrders === "function") {
        await window.loadOrders();
      }

      setTimeout(closeCoursePaymentModal, 1200);
    } catch (error) {
      console.error("Web3 payment error:", error);
      setPaymentStatus(error.message || "Thanh toan that bai.", "error");
    } finally {
      setPayButtonLoading(false);
    }
  }

  async function payGymHeartCourseWithMetaMask(course, user, options = {}) {
    statusHandler = options.onStatus || null;

    try {
      const payment = await payForCourseOnChain(course);
      setPaymentStatus("Giao dich thanh cong. Dang dong bo Supabase...", "info");
      await upsertEnrollmentAfterPayment(course, user, payment);
      setPaymentStatus(`Thanh toan thanh cong. Tx: ${shortHash(payment.txHash)}`, "success");
      return payment;
    } finally {
      statusHandler = null;
    }
  }

  window.GYMHEART_WEB3_PAYMENT = paymentConfig;
  window.openCoursePaymentModal = openCoursePaymentModal;
  window.closeCoursePaymentModal = closeCoursePaymentModal;
  window.paySelectedCourseWithMetaMask = paySelectedCourseWithMetaMask;
  window.payGymHeartCourseWithMetaMask = payGymHeartCourseWithMetaMask;
})();
